const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const DiscountCalculator = require('./discountCalculator');

class CouponService {
  
  // ==========================================
  // CREATE NEW COUPON
  // ==========================================
  static async createCoupon(couponData) {
    // Check if code already exists
    const existing = await Coupon.findOne({ code: couponData.code });
    if (existing) {
      throw new Error(`Coupon code ${couponData.code} already exists`);
    }  // ✅ ADD THIS CLOSING BRACE
    
    // Create new coupon
    const coupon = new Coupon({
      ...couponData,
      current_usage: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Save to database
    return await coupon.save();
  }  // ✅ MAKE SURE THIS IS HERE TOO

  
  
  // ==========================================
  // GET ALL COUPONS
  // ==========================================
  static async getAllCoupons(filters = {}, pagination = {}) {
    const { type, is_active, code } = filters;
    const { limit = 25, offset = 0 } = pagination;
    
    // Build filter query
    const query = {};
    if (type) query.type = type;
    if (is_active !== undefined) query.is_active = is_active;
    if (code) query.code = new RegExp(code, 'i');
    
    // Get coupons from database
    const coupons = await Coupon.find(query)
      .limit(limit)
      .skip(offset)
      .sort({ created_at: -1 });
    
    // Count total
    const total = await Coupon.countDocuments(query);
    
    return {
      coupons,
      pagination: { total, limit, offset }
    };
  }
  
  
  // ==========================================
  // GET SINGLE COUPON BY ID
  // ==========================================
  static async getCouponById(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new Error(`Coupon not found`);
    }
    return coupon;
  }
  
  
  // ==========================================
  // UPDATE COUPON
  // ==========================================
  static async updateCoupon(couponId, updateData) {
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    if (!coupon) {
      throw new Error(`Coupon not found`);
    }
    return coupon;
  }
  
  
  // ==========================================
  // DELETE COUPON
  // ==========================================
  static async deleteCoupon(couponId) {
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      throw new Error(`Coupon not found`);
    }
    return coupon;
  }
  
  
  // ==========================================
  // CHECK IF COUPON IS APPLICABLE
  // ==========================================
  static async isCouponApplicable(coupon, cartItems) {
    // Check if active
    if (!coupon.is_active) {
      return { applicable: false, reason: 'Coupon is inactive' };
    }
    
    // Check expiration
    const now = new Date();
    if (coupon.applicable_till && new Date(coupon.applicable_till) < now) {
      return { applicable: false, reason: 'Coupon has expired' };
    }
    
    // Check usage limit
    if (coupon.max_usage && coupon.current_usage >= coupon.max_usage) {
      return { applicable: false, reason: 'Maximum usage reached' };
    }
    
    // Type-specific checks
    switch (coupon.type) {
      case 'CART_WISE':
        return this._checkCartWise(coupon, cartItems);
      case 'PRODUCT_WISE':
        return this._checkProductWise(coupon, cartItems);
      case 'BXGY':
        return this._checkBxGy(coupon, cartItems);
      default:
        return { applicable: false, reason: 'Unknown coupon type' };
    }
  }
  
  
  // ==========================================
  // GET LIST OF APPLICABLE COUPONS FOR CART
  // ==========================================
  static async getApplicableCoupons(cartItems) {
    // Get all active coupons
    const allCoupons = await Coupon.find({ is_active: true });
    const applicable = [];
    
    // Check each coupon
    for (let coupon of allCoupons) {
      const { applicable: isApplicable } = await this.isCouponApplicable(coupon, cartItems);
      
      if (isApplicable) {
        applicable.push({
          coupon_id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          description: coupon.description
        });
      }
    }
    
    return applicable;
  }
  
  
  // ==========================================
  // APPLY COUPON TO CART
  // ==========================================
  static async applyCouponToCart(couponId, cartItems) {
    // Get coupon
    const coupon = await this.getCouponById(couponId);
    
    // Check if applicable
    const { applicable } = await this.isCouponApplicable(coupon, cartItems);
    if (!applicable) {
      throw new Error('Coupon cannot be applied to this cart');
    }
    
    // Calculate discount based on type
    let discountResult;
    
    switch (coupon.type) {
      case 'CART_WISE':
        discountResult = DiscountCalculator.calculateCartWiseDiscount(
          cartItems,
          coupon.conditions,
          coupon.discount
        );
        break;
        
      case 'PRODUCT_WISE':
        discountResult = DiscountCalculator.calculateProductWiseDiscount(
          cartItems,
          coupon.conditions.applicable_products,
          coupon.discount
        );
        break;
        
      case 'BXGY':
        discountResult = DiscountCalculator.calculateBxGyDiscount(
          cartItems,
          coupon.conditions.buy_quantity,
          coupon.conditions.get_quantity,
          coupon.conditions.buy_from,
          coupon.conditions.get_from,
          coupon.conditions.repetition_limit
        );
        break;
    }
    
    if (!discountResult.applicable) {
      throw new Error(discountResult.reason);
    }
    
    // Update usage count
    await Coupon.findByIdAndUpdate(coupon._id, {
      current_usage: coupon.current_usage + 1
    });
    
    // Record usage
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await CouponUsage.create({
      coupon_id: coupon._id,
      user_id: 'user_123',
      discount_amount: discountResult.discountAmount,
      cart_total: cartTotal
    });
    
    return {
      discount_amount: discountResult.discountAmount,
      coupon_code: coupon.code,
      coupon_type: coupon.type
    };
  }
  
  
  // ========== PRIVATE HELPER METHODS ==========
  
  static _checkCartWise(coupon, cartItems) {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    if (total >= coupon.conditions.minimum_cart_value) {
      return { applicable: true };
    }
    
    return {
      applicable: false,
      reason: `Cart total Rs.${total} below minimum Rs.${coupon.conditions.minimum_cart_value}`
    };
  }
  
  static _checkProductWise(coupon, cartItems) {
    const hasProduct = cartItems.some(item =>
      coupon.conditions.applicable_products.includes(item.product_id)
    );
    
    if (hasProduct) {
      return { applicable: true };
    }
    
    return { applicable: false, reason: 'No applicable products in cart' };
  }
  
  static _checkBxGy(coupon, cartItems) {
    const buyCount = cartItems
      .filter(item => coupon.conditions.buy_from.includes(item.product_id))
      .reduce((sum, item) => sum + item.quantity, 0);
    
    if (buyCount >= coupon.conditions.buy_quantity) {
      return { applicable: true };
    }
    
    return {
      applicable: false,
      reason: `Need ${coupon.conditions.buy_quantity} items from buy array, found ${buyCount}`
    };
  }
}

module.exports = CouponService;
