const Settings = require('../models/Settings');

const getOrCreate = async () => {
  let s = await Settings.findById('site_settings');
  if (!s) s = await Settings.create({ _id: 'site_settings' });
  return s;
};

exports.getSettings = async (req, res) => {
  const settings = await getOrCreate();
  res.json({ success: true, settings });
};

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

  const booleans = ['storeOpen', 'announcementActive'];
  const numbers  = ['freeDeliveryAbove', 'deliveryCharge', 'minOrderAmount'];

  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] === undefined) return;
    if (booleans.includes(k)) {
      // Handle all possible formats
      const val = req.body[k];
      updates[k] = val === true || val === 'true' || val === 1 || val === '1';
    } else if (numbers.includes(k)) {
      updates[k] = Number(req.body[k]);
    } else {
      updates[k] = req.body[k];
    }
  });

  console.log('Settings update:', updates); // debug log

  const settings = await Settings.findByIdAndUpdate(
    'site_settings',
    { $set: updates },
    { new: true, upsert: true, runValidators: false }
  );
  res.json({ success: true, settings });
};