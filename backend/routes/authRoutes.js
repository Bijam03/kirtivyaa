const router = require('express').Router();
const {
  register, login, getMe, updateProfile, changePassword,
  registerValidation, loginValidation,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login',    loginValidation,    login);
router.get('/me',               protect, getMe);
router.put('/profile',          protect, updateProfile);
router.put('/change-password',  protect, changePassword);

module.exports = router;
