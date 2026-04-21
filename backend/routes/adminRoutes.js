const router = require('express').Router();
const { getDashboard, getUsers, updateUserRole, toggleBlockUser } = require('../controllers/adminController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// Settings — GET is public (frontend needs brand data), PUT is admin-only
router.get('/settings',                    getSettings);
router.put('/settings',            protect, admin, updateSettings);

// Everything else needs admin
router.use(protect, admin);

router.get('/dashboard',            getDashboard);
router.get('/users',                getUsers);
router.put('/users/:id/role',       updateUserRole);
router.put('/users/:id/block',      toggleBlockUser);

module.exports = router;
