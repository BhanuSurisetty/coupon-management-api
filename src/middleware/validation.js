/**
 * Input validation middleware using Joi
 */

const Joi = require('joi');

const validateCoupon = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().required().min(3).max(20),
    type: Joi.string().valid('CART_WISE', 'PRODUCT_WISE', 'BXGY').required(),
    discount: Joi.object({
      type: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required(),
      value: Joi.number().min(0).required()
    }).required(),
    is_active: Joi.boolean(),
    conditions: Joi.object()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  req.body = value;
  next();
};

module.exports = { validateCoupon };
