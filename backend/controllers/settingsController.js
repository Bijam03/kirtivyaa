const Settings = require('../models/Settings');

// Get or create settings (singleton)
const getOrCreate = async () => {
  let s = await Settings.findById('site_settings');
  if (!s) s = await Settings.create({ _id: 'site_settings' });
  return s;
};

// @GET /api/admin/settings  — public (frontend needs brand info)
exports.getSettings = async (req, res) => {
  const settings = await getOrCreate();
  res.json({ success: true, settings });
};

// @PUT /api/admin/settings  [admin]
exports.updateSettings = async (req, res) => {
  const allowed = [
    'brandName','tagline','ownerName','city','whatsappNumber','email',
    'address','openingHours','fssaiNumber','instagramUrl','facebookUrl',
    'heroBadgeText','heroTitle','heroSubtitle',
    'heroStatCustomers','heroStatVarieties','heroStatRating','heroStatYears',
    'todaySpecialTitle','todaySpecialDesc','todaySpecialOfferEndsAt',
    'freeDeliveryAbove','deliveryCharge','minOrderAmount','deliveryCities',
    'orderCutoffTime','announcementBanner','announcementActive',
    'storeOpen','storeClosedMessage',
  ];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const settings = await Settings.findByIdAndUpdate(
    'site_settings', updates, { new: true, upsert: true }
  );
  res.json({ success: true, settings });
};
