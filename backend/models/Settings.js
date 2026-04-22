const mongoose = require('mongoose');

// Singleton settings document for the bakery
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'site_settings' },

  // ── Brand ─────────────────────────────────────────────
  brandName:    { type: String, default: 'Kirtivyaa' },
  tagline:      { type: String, default: 'Freshly Baked Happiness 🍰' },
  ownerName:    { type: String, default: 'Kirti Agarwal' },
  city:         { type: String, default: 'Pune' },
  whatsappNumber: { type: String, default: '917350554539' },
  email:        { type: String, default: 'agarwalkirtim20@gmail.com' },
  address:      { type: String, default: 'Khese Park, Lohegaon Pune, Maharashtra' },
  openingHours: { type: String, default: 'Mon–Sun: 8 AM – 8 PM' },
  fssaiNumber:  { type: String, default: '' },
  instagramUrl: { type: String, default: '' },
  facebookUrl:  { type: String, default: '' },

  // ── Homepage banner ───────────────────────────────────
  heroBadgeText:   { type: String, default: '✨ Freshly Baked Daily in Pune' },
  heroTitle:       { type: String, default: 'Freshly Baked\nHappiness 🍰' },
  heroSubtitle:    { type: String, default: 'Artisan chocolate cakes, cupcakes, brownies & luxurious gift hampers — made with love in our home kitchen, baked fresh every morning.' },
  heroStatCustomers:{ type: String, default: '2,000+' },
  heroStatVarieties:{ type: String, default: '50+' },
  heroStatRating:   { type: String, default: '4.9 ★' },
  heroStatYears:    { type: String, default: '5+' },

  // ── Today's Special ───────────────────────────────────
  todaySpecialTitle:   { type: String, default: 'Dark Chocolate Raspberry Cake' },
  todaySpecialDesc:    { type: String, default: 'Rich Belgian dark chocolate sponge layered with fresh raspberry compote and silky chocolate mousse. Today only!' },
  todaySpecialOfferEndsAt: { type: Date },   // If set, countdown shows till this time; else till midnight

  // ── Delivery / order rules ────────────────────────────
  freeDeliveryAbove: { type: Number, default: 999 },
  deliveryCharge:    { type: Number, default: 60 },
  minOrderAmount:    { type: Number, default: 200 },
  deliveryCities:    [{ type: String }],    // ['Pune', 'Pimpri', 'Chinchwad']
  orderCutoffTime:   { type: String, default: '10:00' }, // Same-day order cutoff

  // ── Announcements ─────────────────────────────────────
  announcementBanner: { type: String, default: 'sale is live!' },  // Shows a top bar if non-empty
  announcementActive: { type: Boolean, default: false },

  // ── Store status ──────────────────────────────────────
  storeOpen:        { type: Boolean, default: true },
  storeClosedMessage: { type: String, default: 'We are closed right now. Order via WhatsApp!' },

}, { timestamps: true, _id: false }); 

module.exports = mongoose.model('Settings', settingsSchema);
