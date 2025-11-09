const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  coupon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  discount_amount: {
    type: Number,
    required: true
  },
  cart_total: {
    type: Number,
    required: true
  },
  applied_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
