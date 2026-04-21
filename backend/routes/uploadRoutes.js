// uploadRoutes.js
const router = require('express').Router();
const { upload } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

module.exports = router;
