/**
 * User Model
 * 
 * This model handles user authentication data with green software practices:
 * - Selective indexing for efficient queries
 * - Password encryption with bcrypt
 * - Field validation to prevent unnecessary database operations
 * - Minimized schema with only essential fields
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and dashes'],
    index: true // Efficient lookup by username
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true, // Efficient lookup by email
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(v) {
        // At least one uppercase, one lowercase, one number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  profileImage: {
    type: String,
    default: 'default-avatar.png'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // Can't be changed after creation
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // User preferences including energy saving options for green software
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system' // Default to system preference for energy efficiency
    },
    enableEnergyEfficiency: {
      type: Boolean,
      default: true
    },
    dataConservation: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically manage createdAt/updatedAt
  // Optimize for query performance
  collation: { locale: 'en', strength: 2 } 
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  try {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();
    
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.isLocked && this.lockUntil && this.lockUntil > Date.now();
};

// Method to compare passwords (green practice: optimized comparison)
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (this.isAccountLocked()) {
      throw new Error('Account is locked. Please try again later.');
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    if (!isMatch && this.loginAttempts >= 5) {
      this.isLocked = true;
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      await this.save();
      throw new Error('Account locked due to too many failed attempts');
    }
    
    return isMatch;
  } catch (error) {
    throw error;
  }
};

// Static method to find user by credentials (green practice: efficient query with projection)
userSchema.statics.findByCredentials = async function(email, password) {
  try {
    // Only fetch necessary fields
    const user = await this.findOne({ email }).select('+password');
    if (!user) {
      return null;
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in findByCredentials:', error);
    throw new Error('Authentication error');
  }
};

// This prevents the password from being returned in queries
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;