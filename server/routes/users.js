const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Error fetching users'
    });
  }
});

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get user's documents count
    const documentsCount = await Document.countDocuments({
      author: user._id,
      isDeleted: false
    });

    // Get user's public documents
    const publicDocuments = await Document.find({
      author: user._id,
      privacy: 'public',
      isDeleted: false
    })
      .select('title status updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          documentsCount,
          publicDocumentsCount: publicDocuments.length
        },
        recentDocuments: publicDocuments
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Error fetching user'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile'
    });
  }
});

// @desc    Get user's documents
// @route   GET /api/users/:id/documents
// @access  Private
router.get('/:id/documents', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Build query based on permissions
    let query = {
      isDeleted: false
    };

    // If viewing own documents or admin
    if (req.params.id === req.user.id || req.user.role === 'admin') {
      query.author = req.params.id;
    } else {
      // Can only see public documents of other users
      query.$and = [
        { author: req.params.id },
        { privacy: 'public' }
      ];
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const documents = await Document.find(query)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({
      message: 'Error fetching user documents'
    });
  }
});

// @desc    Get user's collaborated documents
// @route   GET /api/users/:id/collaborations
// @access  Private
router.get('/:id/collaborations', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Can only view own collaborations or admin can view any
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const query = {
      'permissions.user': req.params.id,
      isDeleted: false
    };

    const documents = await Document.find(query)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('permissions.user', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get collaborations error:', error);
    res.status(500).json({
      message: 'Error fetching collaborations'
    });
  }
});

// @desc    Search users (for @mentions)
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Error searching users'
    });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete user's documents
    await Document.updateMany(
      { author: user._id },
      { isDeleted: true }
    );

    // Remove user from all collaborations
    await Document.updateMany(
      { 'permissions.user': user._id },
      { $pull: { permissions: { user: user._id }, collaborators: user._id } }
    );

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Error deleting user'
    });
  }
});

module.exports = router; 