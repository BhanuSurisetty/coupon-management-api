/**
 * Validation helper functions
 */

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isCouponCodeValid = (code) => {
  // Only alphanumeric, 3-20 characters
  return /^[A-Z0-9]{3,20}$/.test(code);
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isCouponCodeValid
};
