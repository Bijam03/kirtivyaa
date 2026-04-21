const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @POST /api/payment/create-order
exports.createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const razorpay  = getRazorpay();
  const rzpOrder  = await razorpay.orders.create({
    amount:   Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt:  order.orderNumber,
    notes:    { orderId: order._id.toString() },
  });

  order.paymentResult = { razorpayOrderId: rzpOrder.id };
  await order.save();

  res.json({
    success:         true,
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    keyId:           process.env.RAZORPAY_KEY_ID,
  });
};

// @POST /api/payment/verify
exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const body     = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpaySignature) {
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.isPaid         = true;
  order.orderStatus    = 'Confirmed';
  order.paymentResult  = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    status: 'paid',
    paidAt: new Date(),
  };
  order.statusHistory.push({
    status:  'Confirmed',
    message: 'Payment received via Razorpay',
  });
  await order.save();

  res.json({ success: true, message: 'Payment verified', order });
};