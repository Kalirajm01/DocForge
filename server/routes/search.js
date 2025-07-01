const express = require('express');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Search documents
// @route   GET /api/search/documents
// @access  Private/Public
router.get('/documents', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10, status, privacy } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    // Build search query
    const searchQuery = {
      $text: { $search: q },
      isDeleted: false
    };

    // Add filters
    if (status) searchQuery.status = status;
    if (privacy) searchQuery.privacy = privacy;

    // Handle privacy permissions
    if (req.user) {
      // Authenticated user can see their own docs, public docs, and docs they have permission for
      searchQuery.$or = [
        { author: req.user.id },
        { privacy: 'public' },
        { 'permissions.user': req.user.id }
      ];
    } else {
      // Unauthenticated user can only see public docs
      searchQuery.privacy = 'public';
    }

    const documents = await Document.find(searchQuery)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(searchQuery);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      message: 'Error searching documents'
    });
  }
});

// @desc    Search users
// @route   GET /api/search/users
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const searchQuery = {
      $text: { $search: q }
    };

    const users = await User.find(searchQuery)
      .select('name email')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Error searching users'
    });
  }
});

// @desc    Global search (documents + users)
// @route   GET /api/search
// @access  Private/Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const results = {
      documents: [],
      users: [],
      total: 0
    };

    // Search documents
    if (!type || type === 'documents' || type === 'all') {
      const documentQuery = {
        $text: { $search: q },
        isDeleted: false
      };

      // Handle privacy permissions
      if (req.user) {
        documentQuery.$or = [
          { author: req.user.id },
          { privacy: 'public' },
          { 'permissions.user': req.user.id }
        ];
      } else {
        documentQuery.privacy = 'public';
      }

      const documents = await Document.find(documentQuery)
        .populate('author', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      results.documents = documents;
    }

    // Search users (only for authenticated users)
    if ((!type || type === 'users' || type === 'all') && req.user) {
      const userQuery = {
        $text: { $search: q }
      };

      const users = await User.find(userQuery)
        .select('name email')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(parseInt(limit));

      results.users = users;
    }

    // Calculate total results
    results.total = results.documents.length + results.users.length;

    res.json({
      success: true,
      data: results,
      query: q,
      type: type || 'all'
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      message: 'Error performing search'
    });
  }
});

// @desc    Search suggestions (autocomplete)
// @route   GET /api/search/suggestions
// @access  Private/Public
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'documents' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = [];

    if (type === 'documents' || type === 'all') {
      // Search document titles
      const documentQuery = {
        title: { $regex: q, $options: 'i' },
        isDeleted: false
      };

      // Handle privacy permissions
      if (req.user) {
        documentQuery.$or = [
          { author: req.user.id },
          { privacy: 'public' },
          { 'permissions.user': req.user.id }
        ];
      } else {
        documentQuery.privacy = 'public';
      }

      const documents = await Document.find(documentQuery)
        .select('title')
        .limit(5);

      suggestions.push(...documents.map(doc => ({
        type: 'document',
        title: doc.title,
        id: doc._id
      })));
    }

    if ((type === 'users' || type === 'all') && req.user) {
      // Search user names
      const userQuery = {
        name: { $regex: q, $options: 'i' }
      };

      const users = await User.find(userQuery)
        .select('name email')
        .limit(5);

      suggestions.push(...users.map(user => ({
        type: 'user',
        name: user.name,
        email: user.email,
        id: user._id
      })));
    }

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      message: 'Error getting search suggestions'
    });
  }
});

module.exports = router; 