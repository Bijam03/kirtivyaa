const router = require('express').Router();
const {
  getProducts, getFeatured, getTodaySpecial, getBestSellers,
  getNewArrivals, getFeaturedHampers, getProduct, getProductBySlug,
  createProduct, updateProduct, deleteProduct, updateFlags, addReview,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public — specific routes BEFORE /:id
router.get('/',                     getProducts);
router.get('/featured',             getFeatured);
router.get('/today-special',        getTodaySpecial);
router.get('/bestsellers',          getBestSellers);
router.get('/new-arrivals',         getNewArrivals);
router.get('/hampers',              getFeaturedHampers);
router.get('/slug/:slug',           getProductBySlug);
router.get('/:id',                  getProduct);

// Protected
router.post('/:id/reviews',         protect, addReview);

// Admin
router.post('/',                    protect, admin, upload.array('images', 5), createProduct);
router.put('/:id',                  protect, admin, upload.array('images', 5), updateProduct);
router.patch('/:id/flags',          protect, admin, updateFlags);
router.delete('/:id',               protect, admin, deleteProduct);

module.exports = router;
