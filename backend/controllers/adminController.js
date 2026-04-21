const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

  const [
    totalOrders, totalRevenue, monthRevenue,
    totalProducts, totalUsers, pendingOrders,
    recentOrders, ordersByStatus,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Product.countDocuments({ isAvailable: true }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed', 'Baking'] } }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name')
      .select('orderNumber customerName customerPhone totalPrice orderStatus paymentMethod createdAt')
      .lean(),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue:  totalRevenue[0]?.total  || 0,
      monthRevenue:  monthRevenue[0]?.total  || 0,
      totalProducts,
      totalUsers,
      pendingOrders,
    },
    recentOrders,
    ordersByStatus,
  });
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 30, search } = req.query;
  const filter = {};
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Add order count per user
  const usersWithOrders = await Promise.all(users.map(async u => ({
    ...u,
    orderCount: await Order.countDocuments({ user: u._id }),
  })));

  res.json({ success: true, total, users: usersWithOrders });
};

// @PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id, { role: req.body.role }, { new: true }
  ).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ success: true, user });
};

// @PUT /api/admin/users/:id/block
exports.toggleBlockUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot block yourself.' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isBlocked: user.isBlocked, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.` });
};
