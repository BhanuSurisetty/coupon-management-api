const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['CART_WISE', 'PRODUCT_WISE', 'BXGY'],
    required: true
  },
  description: String,
  
  // Discount configuration
  discount: {
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Dates
  applicable_from: Date,
  applicable_till: Date,
  
  // Usage limits
  max_usage: Number,
  max_usage_per_user: Number,
  current_usage: {
    type: Number,
    default: 0
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  
  // Type-specific conditions
  conditions: {
    // For CART_WISE
    minimum_cart_value: Number,
    maximum_discount: Number,
    
    // For PRODUCT_WISE
    applicable_products: [String],
    excluded_products: [String],
    
    // For BXGY
    buy_quantity: Number,
    get_quantity: Number,
    buy_from: [String],
    get_from: [String],
    repetition_limit: Number
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
