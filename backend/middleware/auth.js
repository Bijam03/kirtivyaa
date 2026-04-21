const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Require valid JWT - block if missing/invalid
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'You must be logged in to do this.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been suspended. Contact us on WhatsApp.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Session expired. Please log in again.' });
    return res.status(401).json({ message: 'Invalid session. Please log in again.' });
  }
};

// Admin only
exports.admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access only.' });
};

// Attach user if token present, but never block
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch { /* ignore - unauthenticated is fine */ }
  }
  next();
};
