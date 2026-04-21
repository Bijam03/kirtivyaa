const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Name is required'], trim: true, maxlength: [60, 'Name too long'] },
  email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
              match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  phone:    { type: String, trim: true, match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'] },
  password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked:{ type: Boolean, default: false },
  address: {
    street:  { type: String, trim: true },
    city:    { type: String, default: 'Nagpur', trim: true },
    state:   { type: String, default: 'Maharashtra', trim: true },
    pincode: { type: String, trim: true, match: [/^\d{6}$/, 'Invalid PIN code'] },
  },
  loginAttempts: { type: Number, default: 0 },
  lockUntil:     { type: Date },
  lastLogin:     { type: Date },
  passwordChangedAt: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000, 10) > jwtTimestamp;
  }
  return false;
};

// Virtual: is account locked?
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);
