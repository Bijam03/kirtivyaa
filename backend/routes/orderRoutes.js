const router = require('express').Router();
const {
  createOrder, getMyOrders, getOrder,
  getAllOrders, updateStatus, trackOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

// IMPORTANT: ALL order creation now requires authentication
// optionalAuth removed - replaced with protect
router.post('/',                    protect, createOrder);
router.get('/my',                   protect, getMyOrders);
router.get('/track/:orderNumber',            trackOrder);   // public tracking
router.get('/',                     protect, admin, getAllOrders);
router.get('/:id',                  protect, getOrder);
router.put('/:id/status',           protect, admin, updateStatus);

module.exports = router;
