const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true, maxlength: 120 },
  slug:             { type: String, unique: true },
  description:      { type: String, required: true, maxlength: 2000 },
  shortDescription: { type: String, maxlength: 200 },
  price:            { type: Number, required: true, min: 0 },
  discountPrice:    { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['Cakes', 'Cupcakes', 'Brownies', 'Hampers', 'Custom'],
    required: true,
  },
  images: [{ url: { type: String, required: true }, publicId: { type: String } }],

  // ── Admin-controlled flags ──────────────────────────
  badge:         { type: String, enum: ['bestseller', 'new', 'special', ''], default: '' },
  isFeatured:    { type: Boolean, default: false },
  isAvailable:   { type: Boolean, default: true },
  isTodaySpecial:{ type: Boolean, default: false },   // Shown in "Today's Special" banner
  isBestSeller:  { type: Boolean, default: false },   // Pinned in best sellers row
  isNewArrival:  { type: Boolean, default: false },   // New arrivals section
  isHamperFeatured: { type: Boolean, default: false },// Featured in hamper section

  // ── Offer / discount ────────────────────────────────
  offerLabel:    { type: String, default: '' },        // e.g. "25% OFF Today Only"
  offerEndsAt:   { type: Date },                       // When the offer expires

  // ── Product details ─────────────────────────────────
  stockCount:      { type: Number, default: 100 },
  weight:          { type: String },
  servings:        { type: String },
  ingredients:     [String],
  allergens:       [String],
  customizable:    { type: Boolean, default: false },
  flavourOptions:  [String],
  sizeOptions:     [{ label: String, price: Number }],

  // ── Reviews ─────────────────────────────────────────
  reviews:    [reviewSchema],
  numReviews: { type: Number, default: 0 },
  rating:     { type: Number, default: 0 },

  // ── Sort order ──────────────────────────────────────
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Recalculate rating
productSchema.methods.calcRating = function () {
  if (!this.reviews.length) { this.rating = 0; this.numReviews = 0; return; }
  this.numReviews = this.reviews.length;
  this.rating = +(this.reviews.reduce((s, r) => s + r.rating, 0) / this.numReviews).toFixed(1);
};

// Text index for search
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
