const jwt  = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Never return password even if select: false is missed
  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:     user._id,
      name:    user.name,
      email:   user.email,
      phone:   user.phone,
      role:    user.role,
      address: user.address,
    },
  });
};

// Validation rules (reusable)
exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name too long'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { name, email, password, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'An account with this email already exists.' });

  const user = await User.create({ name, email, password, phone });
  sendToken(user, 201, res);
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { email, password } = req.body;
  // Need to explicitly select password (select: false in schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
  if (user.isBlocked) return res.status(403).json({ message: 'Your account is suspended. WhatsApp us at +91 98765 43210.' });

  const match = await user.matchPassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

  user.lastLogin = new Date();
  user.loginAttempts = 0;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
};

// @PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'address'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  // Validate phone if provided
  if (updates.phone && !/^[6-9]\d{9}$/.test(updates.phone)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number.' });
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true,
  });
  res.json({ success: true, user });
};

// @PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
};
