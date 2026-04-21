const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:         { type: String, required: true },
  image:        { type: String },
  price:        { type: Number, required: true },
  qty:          { type: Number, required: true, default: 1 },
  customMessage:{ type: String },   // message on cake
  selectedSize: { type: String },
  selectedFlavour: { type: String },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Guest orders allowed
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },

  orderItems: [orderItemSchema],

  shippingAddress: {
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, default: 'Maharashtra' },
    pincode: { type: String, required: true },
  },

  deliveryDate:  { type: Date },
  deliverySlot:  { type: String },   // e.g. "Morning 9-12"
  specialInstructions: { type: String },

  itemsPrice:    { type: Number, required: true },
  deliveryPrice: { type: Number, required: true, default: 0 },
  totalPrice:    { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['COD', 'UPI', 'Razorpay', 'WhatsApp'],
    required: true,
  },
  paymentResult: {
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status:            String,
    paidAt:            Date,
  },
  isPaid: { type: Boolean, default: false },

  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Baking', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },

  statusHistory: [{
    status:    String,
    message:   String,
    updatedAt: { type: Date, default: Date.now },
  }],

  whatsappSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-increment readable order number
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `SC${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.add({ orderNumber: { type: String, unique: true, sparse: true } });

module.exports = mongoose.model('Order', orderSchema);
