/**
 * Data formatting helper functions
 */

const formatPrice = (price) => {
  return Math.round(price * 100) / 100;
};

const formatDate = (date) => {
  return new Date(date).toISOString();
};

const formatCouponResponse = (coupon) => {
  return {
    id: coupon._id,
    code: coupon.code,
    type: coupon.type,
    discount: coupon.discount,
    isActive: coupon.is_active,
    createdAt: formatDate(coupon.created_at),
    updatedAt: formatDate(coupon.updated_at)
  };
};

module.exports = {
  formatPrice,
  formatDate,
  formatCouponResponse
};
