const Order   = require('../models/Order');
const Product = require('../models/Product');

const DELIVERY_CHARGE      = 60;
const FREE_DELIVERY_ABOVE  = 999;
const MIN_ORDER_AMOUNT     = 200;
const MAX_ITEMS_PER_ORDER  = 20;
const MAX_QTY_PER_ITEM     = 10;

// Build WhatsApp pre-filled message
const buildWAMessage = (order) => {
  const items = order.orderItems.map(i => {
    let line = `• ${i.name}`;
    if (i.selectedSize)    line += ` [${i.selectedSize}]`;
    if (i.selectedFlavour) line += ` (${i.selectedFlavour})`;
    if (i.customMessage)   line += `\n  🎂 Cake msg: "${i.customMessage}"`;
    line += ` × ${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`;
    return line;
  }).join('\n');

  const deliveryInfo = order.deliveryDate
    ? `📅 Delivery: ${new Date(order.deliveryDate).toDateString()} | ${order.deliverySlot || ''}`
    : '📅 Delivery: ASAP';

  const msg =
    `🍰 *New SweetCrumbs Order — #${order.orderNumber}*\n\n` +
    `👤 *${order.customerName}*\n` +
    `📱 ${order.customerPhone}\n` +
    `📧 ${order.customerEmail}\n\n` +
    `🛒 *Items:*\n${items}\n\n` +
    `💰 Subtotal: ₹${order.itemsPrice.toLocaleString('en-IN')}\n` +
    `🚚 Delivery: ${order.deliveryPrice === 0 ? 'FREE' : '₹' + order.deliveryPrice}\n` +
    `💵 *Total: ₹${order.totalPrice.toLocaleString('en-IN')}*\n` +
    `💳 Payment: ${order.paymentMethod}\n\n` +
    `${deliveryInfo}\n` +
    `📍 ${order.shippingAddress.street}, ${order.shippingAddress.city} — ${order.shippingAddress.pincode}\n` +
    (order.specialInstructions ? `\n📝 Notes: ${order.specialInstructions}` : '');

  return encodeURIComponent(msg);
};

// @POST /api/orders  — LOGIN REQUIRED
exports.createOrder = async (req, res) => {
  // Must be logged in
  if (!req.user) {
    return res.status(401).json({
      message: 'Please login or create an account before placing an order.',
      requiresAuth: true,
    });
  }

  const {
    orderItems, shippingAddress, paymentMethod,
    deliveryDate, deliverySlot, specialInstructions,
  } = req.body;

  // ── Validate items ────────────────────────────────────
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty.' });
  }
  if (orderItems.length > MAX_ITEMS_PER_ORDER) {
    return res.status(400).json({ message: `Maximum ${MAX_ITEMS_PER_ORDER} different items per order.` });
  }

  // ── Validate address ──────────────────────────────────
  if (!shippingAddress?.street?.trim()) return res.status(400).json({ message: 'Delivery address is required.' });
  if (!shippingAddress?.pincode?.trim()) return res.status(400).json({ message: 'PIN code is required.' });
  if (!/^\d{6}$/.test(shippingAddress.pincode)) return res.status(400).json({ message: 'Invalid PIN code.' });

  // ── Validate delivery date ────────────────────────────
  if (deliveryDate) {
    const d = new Date(deliveryDate);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < today) return res.status(400).json({ message: 'Delivery date cannot be in the past.' });
    const maxDays = new Date(); maxDays.setDate(maxDays.getDate() + 30);
    if (d > maxDays) return res.status(400).json({ message: 'Delivery date cannot be more than 30 days away.' });
  }

  // ── Validate payment method ───────────────────────────
  const validMethods = ['COD', 'UPI', 'Razorpay', 'WhatsApp'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }

  // ── Verify prices server-side (prevent tampering) ─────
  let itemsPrice = 0;
  const verifiedItems = [];

  for (const item of orderItems) {
    if (!item.product) return res.status(400).json({ message: 'Invalid product in cart.' });

    const qty = parseInt(item.qty, 10);
    if (!qty || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({ message: `Quantity must be between 1 and ${MAX_QTY_PER_ITEM}.` });
    }

    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ message: `A product in your cart is no longer available.` });
    if (!product.isAvailable) return res.status(400).json({ message: `${product.name} is currently unavailable.` });

    // Server-side price resolution — never trust client price
    let price = product.price;
    if (item.selectedSize && product.sizeOptions?.length) {
      const sizeOpt = product.sizeOptions.find(s => s.label === item.selectedSize);
      if (!sizeOpt) return res.status(400).json({ message: `Invalid size "${item.selectedSize}" for ${product.name}.` });
      price = sizeOpt.price;
    }

    // Sanitize custom message
    const customMessage = item.customMessage
      ? String(item.customMessage).slice(0, 80).trim()
      : undefined;

    verifiedItems.push({
      product:         product._id,
      name:            product.name,
      image:           product.images?.[0]?.url,
      price,
      qty,
      customMessage,
      selectedSize:    item.selectedSize,
      selectedFlavour: item.selectedFlavour,
    });
    itemsPrice += price * qty;
  }

  // ── Minimum order check ───────────────────────────────
  if (itemsPrice < MIN_ORDER_AMOUNT) {
    return res.status(400).json({ message: `Minimum order amount is ₹${MIN_ORDER_AMOUNT}.` });
  }

  const deliveryPrice = itemsPrice >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  const totalPrice    = itemsPrice + deliveryPrice;

  // ── Use logged-in user's details (don't trust body for these) ─
  const order = await Order.create({
    user:          req.user._id,
    customerName:  req.user.name,
    customerEmail: req.user.email,
    customerPhone: req.user.phone || shippingAddress.phone || '',
    orderItems:    verifiedItems,
    shippingAddress: {
      street:  shippingAddress.street.trim(),
      city:    shippingAddress.city?.trim()    || 'Nagpur',
      state:   shippingAddress.state?.trim()   || 'Maharashtra',
      pincode: shippingAddress.pincode.trim(),
    },
    paymentMethod,
    deliveryDate:  deliveryDate || undefined,
    deliverySlot:  deliverySlot || 'Morning (9 AM – 1 PM)',
    specialInstructions: specialInstructions ? String(specialInstructions).slice(0, 500).trim() : '',
    itemsPrice,
    deliveryPrice,
    totalPrice,
    statusHistory: [{ status: 'Pending', message: 'Order placed successfully' }],
  });

  const whatsappUrl = `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${buildWAMessage(order)}`;

  res.status(201).json({ success: true, order, whatsappUrl });
};

// @GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems.product', 'name images slug')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, orders });
};

// @GET /api/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('orderItems.product', 'name images slug');
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  // Only owner or admin can view
  if (
    order.user?.toString() !== req.user?._id?.toString() &&
    req.user?.role !== 'admin'
  ) {
    return res.status(403).json({ message: 'Not authorised to view this order.' });
  }
  res.json({ success: true, order });
};

// @GET /api/orders  [admin]
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 25, search } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) filter.$or = [
    { orderNumber: { $regex: search, $options: 'i' } },
    { customerName: { $regex: search, $options: 'i' } },
    { customerPhone: { $regex: search, $options: 'i' } },
  ];
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();
  res.json({ success: true, total, pages: Math.ceil(total / limit), page: Number(page), orders });
};

// @PUT /api/orders/:id/status  [admin]
exports.updateStatus = async (req, res) => {
  const { status, message } = req.body;
  const validStatuses = ['Pending','Confirmed','Baking','Ready','Out for Delivery','Delivered','Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  // Cannot un-cancel or un-deliver
  if (order.orderStatus === 'Cancelled') {
    return res.status(400).json({ message: 'Cannot update a cancelled order.' });
  }

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    message: message || `Status updated to ${status}`,
    updatedAt: new Date(),
  });
  if (status === 'Delivered') {
    order.isPaid    = true;
    order.paymentResult = { ...order.paymentResult, status: 'paid', paidAt: new Date() };
  }
  await order.save();
  res.json({ success: true, order });
};

// @GET /api/orders/track/:orderNumber  [public]
exports.trackOrder = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() })
    .select('orderNumber orderStatus statusHistory deliveryDate customerName itemsPrice totalPrice paymentMethod createdAt')
    .lean();
  if (!order) return res.status(404).json({ message: 'Order not found. Check the order number and try again.' });
  res.json({ success: true, order });
};
