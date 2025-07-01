const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all documents (with permissions)
// @route   GET /api/documents
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user permissions
    const query = {
      isDeleted: false,
      $or: [
        { author: req.user.id },
        { privacy: 'public' },
        { 'permissions.user': req.user.id }
      ]
    };

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add search filter if provided
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const documents = await Document.find(query)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('collaborators', 'name email')
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
    console.error('Get documents error:', error);
    res.status(500).json({
      message: 'Error fetching documents'
    });
  }
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private/Public (depending on privacy)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('collaborators', 'name email')
      .populate('mentions.user', 'name email')
      .populate('permissions.user', 'name email')
      .populate('permissions.grantedBy', 'name email');

    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions
    if (document.privacy === 'private') {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required'
        });
      }
      
      if (!document.hasPermission(req.user.id, 'view')) {
        return res.status(403).json({
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      message: 'Error fetching document'
    });
  }
});

// @desc    Create document
// @route   POST /api/documents
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('privacy').isIn(['public', 'private']).withMessage('Privacy must be public or private'),
  body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, privacy, status, tags } = req.body;

    // Process @mentions in content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUser = await User.findOne({ 
        $or: [
          { name: { $regex: match[1], $options: 'i' } },
          { email: { $regex: match[1], $options: 'i' } }
        ]
      });
      
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }

    const document = await Document.create({
      title,
      content,
      author: req.user.id,
      privacy,
      status,
      tags: tags || [],
      lastModifiedBy: req.user.id
    });

    // Add mentions to document
    mentions.forEach(userId => {
      document.addMention(userId);
    });

    // Auto-grant read access to mentioned users
    mentions.forEach(userId => {
      document.addCollaborator(userId, 'view', req.user.id);
    });

    await document.save();

    // Populate the document for response
    await document.populate([
      { path: 'author', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name email' },
      { path: 'mentions.user', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      message: 'Error creating document'
    });
  }
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be less than 200 characters'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('privacy').optional().isIn(['public', 'private']).withMessage('Privacy must be public or private'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const document = await Document.findById(req.params.id);
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions
    if (!document.hasPermission(req.user.id, 'edit')) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const { title, content, privacy, status, tags } = req.body;

    // Process @mentions in content if content is being updated
    if (content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      
      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedUser = await User.findOne({ 
          $or: [
            { name: { $regex: match[1], $options: 'i' } },
            { email: { $regex: match[1], $options: 'i' } }
          ]
        });
        
        if (mentionedUser) {
          mentions.push(mentionedUser._id);
        }
      }

      // Add new mentions
      mentions.forEach(userId => {
        document.addMention(userId);
        document.addCollaborator(userId, 'view', req.user.id);
      });
    }

    // Update document
    if (title) document.title = title;
    if (content) document.content = content;
    if (privacy) document.privacy = privacy;
    if (status) document.status = status;
    if (tags) document.tags = tags;
    
    document.lastModifiedBy = req.user.id;

    await document.save();

    // Populate the document for response
    await document.populate([
      { path: 'author', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name email' },
      { path: 'mentions.user', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      message: 'Error updating document'
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions (only author or admin can delete)
    if (document.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Soft delete
    document.isDeleted = true;
    await document.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      message: 'Error deleting document'
    });
  }
});

// @desc    Get document versions
// @route   GET /api/documents/:id/versions
// @access  Private
router.get('/:id/versions', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('versions.createdBy', 'name email');

    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions
    if (!document.hasPermission(req.user.id, 'view')) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: document.versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      message: 'Error fetching versions'
    });
  }
});

// @desc    Add collaborator
// @route   POST /api/documents/:id/collaborators
// @access  Private
router.post('/:id/collaborators', protect, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('permission').isIn(['view', 'edit', 'admin']).withMessage('Permission must be view, edit, or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const document = await Document.findById(req.params.id);
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions (only author or admin can add collaborators)
    if (document.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const { email, permission } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Add collaborator
    document.addCollaborator(user._id, permission, req.user.id);
    await document.save();

    // Populate the document for response
    await document.populate([
      { path: 'permissions.user', select: 'name email' },
      { path: 'permissions.grantedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: document.permissions
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      message: 'Error adding collaborator'
    });
  }
});

// @desc    Remove collaborator
// @route   DELETE /api/documents/:id/collaborators/:userId
// @access  Private
router.delete('/:id/collaborators/:userId', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Check permissions (only author or admin can remove collaborators)
    if (document.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Remove collaborator
    document.removeCollaborator(req.params.userId);
    await document.save();

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      message: 'Error removing collaborator'
    });
  }
});

module.exports = router; 