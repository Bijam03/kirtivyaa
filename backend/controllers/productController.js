const Product  = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// ── Helpers ───────────────────────────────────────────────
const parseCommaSeparated = (val) =>
  typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : val || [];

const parseJSON = (val, fallback = []) => {
  if (!val || val === '[]') return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
};

// @GET /api/products
exports.getProducts = async (req, res) => {
  const { category, badge, search, sort, page = 1, limit = 12 } = req.query;
  const filter = { isAvailable: true };
  if (category && category !== 'All') filter.category = category;
  if (badge)  filter.badge = badge;
  if (search) filter.$text = { $search: search };

  const sortMap = {
    'price-asc':  { price: 1 },
    'price-desc': { price: -1 },
    'rating':     { rating: -1 },
    'newest':     { createdAt: -1 },
    'popular':    { numReviews: -1 },
  };
  const sortOpt = sortMap[sort] || { sortOrder: 1, createdAt: -1 };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)).lean();

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), products });
};

// @GET /api/products/featured
exports.getFeatured = async (req, res) => {
  const products = await Product.find({ isFeatured: true, isAvailable: true })
    .sort({ sortOrder: 1 }).limit(6).lean();
  res.json({ success: true, products });
};

// @GET /api/products/today-special
exports.getTodaySpecial = async (req, res) => {
  const product = await Product.findOne({ isTodaySpecial: true, isAvailable: true }).lean();
  res.json({ success: true, product });
};

// @GET /api/products/bestsellers
exports.getBestSellers = async (req, res) => {
  const products = await Product.find({ isBestSeller: true, isAvailable: true })
    .sort({ sortOrder: 1 }).limit(6).lean();
  res.json({ success: true, products });
};

// @GET /api/products/new-arrivals
exports.getNewArrivals = async (req, res) => {
  const products = await Product.find({ isNewArrival: true, isAvailable: true })
    .sort({ createdAt: -1 }).limit(4).lean();
  res.json({ success: true, products });
};

// @GET /api/products/hampers
exports.getFeaturedHampers = async (req, res) => {
  const products = await Product.find({
    isHamperFeatured: true, isAvailable: true, category: 'Hampers',
  }).sort({ sortOrder: 1 }).limit(4).lean();
  res.json({ success: true, products });
};

// @GET /api/products/:id
exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, product });
};

// @GET /api/products/slug/:slug
exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, product });
};

// @PATCH /api/products/:id/flags  [admin] — quick flag update without re-upload
exports.updateFlags = async (req, res) => {
  const allowed = [
    'isAvailable','isFeatured','isTodaySpecial','isBestSeller',
    'isNewArrival','isHamperFeatured','customizable','badge','sortOrder',
    'offerLabel','offerEndsAt',
  ];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  // Enforce only one Today's Special
  if (updates.isTodaySpecial === true) {
    await Product.updateMany({ isTodaySpecial: true }, { isTodaySpecial: false });
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, product });
};

// @POST /api/products  [admin]
exports.createProduct = async (req, res) => {
  const data = { ...req.body };

 if (req.files?.length) {
  const { uploadToCloudinary } = require('../config/cloudinary');
  const uploaded = await Promise.all(
    req.files.map(f => uploadToCloudinary(f.buffer))
  );
  data.images = uploaded.map(r => ({ url: r.secure_url, publicId: r.public_id }));
}

  data.ingredients   = parseCommaSeparated(data.ingredients);
  data.allergens     = parseCommaSeparated(data.allergens);
  data.flavourOptions= parseCommaSeparated(data.flavourOptions);
  data.sizeOptions   = parseJSON(data.sizeOptions);

  // Coerce booleans sent as strings from FormData
  ['isAvailable','isFeatured','customizable','isTodaySpecial','isBestSeller','isNewArrival','isHamperFeatured'].forEach(k => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  if (data.isTodaySpecial) {
    await Product.updateMany({ isTodaySpecial: true }, { isTodaySpecial: false });
  }

  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
};

// @PUT /api/products/:id  [admin]
exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const data = { ...req.body };

  if (req.files?.length) {
  const { uploadToCloudinary } = require('../config/cloudinary');
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }
  const uploaded = await Promise.all(
    req.files.map(f => uploadToCloudinary(f.buffer))
  );
  data.images = uploaded.map(r => ({ url: r.secure_url, publicId: r.public_id }));
}

  data.ingredients   = parseCommaSeparated(data.ingredients);
  data.allergens     = parseCommaSeparated(data.allergens);
  data.flavourOptions= parseCommaSeparated(data.flavourOptions);
  data.sizeOptions   = parseJSON(data.sizeOptions);

  ['isAvailable','isFeatured','customizable','isTodaySpecial','isBestSeller','isNewArrival','isHamperFeatured'].forEach(k => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  if (data.isTodaySpecial && !product.isTodaySpecial) {
    await Product.updateMany({ _id: { $ne: product._id }, isTodaySpecial: true }, { isTodaySpecial: false });
  }

  Object.assign(product, data);
  await product.save();
  res.json({ success: true, product });
};

// @DELETE /api/products/:id  [admin]
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
};

// @POST /api/products/:id/reviews  [logged in]
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment?.trim()) return res.status(400).json({ message: 'Rating and comment are required.' });
  if (rating < 1 || rating > 5)   return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (already) return res.status(400).json({ message: 'You have already reviewed this product.' });

  product.reviews.push({
    user:    req.user._id,
    name:    req.user.name,
    rating:  Number(rating),
    comment: String(comment).slice(0, 500).trim(),
  });
  product.calcRating();
  await product.save();
  res.status(201).json({ success: true, message: 'Review added!' });
};
