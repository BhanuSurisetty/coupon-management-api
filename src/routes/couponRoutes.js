const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Coupon Management - STATIC ROUTES FIRST
router.post('/', couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.delete('/:id', couponController.deleteCoupon);
router.put('/:id', couponController.updateCoupon);
router.get('/:id', couponController.getCouponById);

// Coupon Application - SPECIFIC/DYNAMIC ROUTES LAST
router.post('/check/applicable', couponController.getApplicableCoupons);
router.post('/:id/apply', couponController.applyCouponToCart);

module.exports = router;
