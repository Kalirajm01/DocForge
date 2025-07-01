const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['view', 'edit', 'admin'],
    default: 'view'
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});

const versionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  changeDescription: {
    type: String,
    default: ''
  }
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  permissions: [permissionSchema],
  versions: [versionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mentionedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create text index for search
documentSchema.index({ 
  title: 'text', 
  content: 'text',
  tags: 'text'
});

// Create compound index for better query performance
documentSchema.index({ author: 1, status: 1, privacy: 1 });
documentSchema.index({ 'permissions.user': 1, privacy: 1 });

// Pre-save middleware to handle versioning
documentSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    // Create new version
    const newVersion = {
      content: this.content,
      title: this.title,
      versionNumber: this.currentVersion + 1,
      createdBy: this.lastModifiedBy || this.author,
      createdAt: new Date()
    };
    
    this.versions.push(newVersion);
    this.currentVersion = newVersion.versionNumber;
  }
  next();
});

// Method to check if user has permission
documentSchema.methods.hasPermission = function(userId, requiredPermission = 'view') {
  // Public documents are viewable by everyone
  if (this.privacy === 'public' && requiredPermission === 'view') {
    return true;
  }
  
  // Author has all permissions
  if (this.author.toString() === userId.toString()) {
    return true;
  }
  
  // Check explicit permissions
  const permission = this.permissions.find(p => p.user.toString() === userId.toString());
  if (!permission) {
    return false;
  }
  
  const permissionLevels = { view: 1, edit: 2, admin: 3 };
  const requiredLevel = permissionLevels[requiredPermission];
  const userLevel = permissionLevels[permission.permission];
  
  return userLevel >= requiredLevel;
};

// Method to add collaborator
documentSchema.methods.addCollaborator = function(userId, permission = 'view', grantedBy) {
  const existingPermission = this.permissions.find(p => p.user.toString() === userId.toString());
  
  if (existingPermission) {
    existingPermission.permission = permission;
    existingPermission.grantedBy = grantedBy;
    existingPermission.grantedAt = new Date();
  } else {
    this.permissions.push({
      user: userId,
      permission,
      grantedBy,
      grantedAt: new Date()
    });
  }
  
  // Add to collaborators if not already there
  if (!this.collaborators.includes(userId)) {
    this.collaborators.push(userId);
  }
};

// Method to remove collaborator
documentSchema.methods.removeCollaborator = function(userId) {
  this.permissions = this.permissions.filter(p => p.user.toString() !== userId.toString());
  this.collaborators = this.collaborators.filter(c => c.toString() !== userId.toString());
};

// Method to add mention
documentSchema.methods.addMention = function(userId) {
  const existingMention = this.mentions.find(m => m.user.toString() === userId.toString());
  if (!existingMention) {
    this.mentions.push({
      user: userId,
      mentionedAt: new Date()
    });
  }
};

module.exports = mongoose.model('Document', documentSchema); 