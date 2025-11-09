// Coupon Types
const COUPON_TYPES = {
  CART_WISE: 'CART_WISE',
  PRODUCT_WISE: 'PRODUCT_WISE',
  BXGY: 'BXGY'
};

// Discount Types
const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT'
};

// Error Messages
const MESSAGES = {
  COUPON_NOT_FOUND: 'Coupon not found',
  COUPON_EXISTS: 'Coupon code already exists',
  INVALID_COUPON: 'Invalid coupon type',
  COUPON_EXPIRED: 'Coupon has expired'
};

module.exports = {
  COUPON_TYPES,
  DISCOUNT_TYPES,
  MESSAGES
};
