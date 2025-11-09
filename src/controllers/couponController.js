/**
 * CouponController.js
 * 
 * Handles all HTTP requests for coupon operations
 * 
 * FIXED: Now accepts 3 cart request formats
 * - Format 1: Direct array [{ product_id, price, quantity }, ...]
 * - Format 2: With cartItems: { cartItems: [...] }
 * - Format 3: With items: { items: [...] }
 */

const CouponService = require('../services/couponService');

class CouponController {

  /**
   * CREATE COUPON
   * POST /coupons
   */
  static async createCoupon(req, res) {
    try {
      console.log('🔵 POST /coupons - Creating coupon');

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is empty'
        });
      }

      const coupon = await CouponService.createCoupon(req.body);

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        coupon
      });

    } catch (error) {
      console.error('❌ Error in createCoupon:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * GET ALL COUPONS
   * GET /coupons?type=CART_WISE&is_active=true&code=SUMMER&limit=25&offset=0
   */
  static async getAllCoupons(req, res) {
    try {
      console.log('🔵 GET /coupons - Fetching all coupons');

      const { type, is_active, code, limit = 25, offset = 0 } = req.query;

      const filters = {};
      
      if (type) {
        filters.type = type;
      }
      if (code) {
        filters.code = code;
      }
      
      if (typeof is_active !== 'undefined') {
        filters.is_active = is_active === 'true';
      }

      const result = await CouponService.getAllCoupons(
        filters,
        { 
          limit: parseInt(limit) || 25, 
          offset: parseInt(offset) || 0 
        }
      );

      res.status(200).json({
        success: true,
        data: result.coupons,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('❌ Error in getAllCoupons:', error.message);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * GET SINGLE COUPON BY ID
   * GET /coupons/:id
   */
  static async getCouponById(req, res) {
    try {
      console.log('🔵 GET /coupons/:id - Fetching coupon by ID');

      const couponId = req.params.id;

      if (!couponId) {
        return res.status(400).json({
          success: false,
          message: 'Coupon ID is required'
        });
      }

      const coupon = await CouponService.getCouponById(couponId);

      res.status(200).json({
        success: true,
        coupon
      });

    } catch (error) {
      console.error('❌ Error in getCouponById:', error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * UPDATE COUPON
   * PUT /coupons/:id
   */
  static async updateCoupon(req, res) {
    try {
      console.log('🔵 PUT /coupons/:id - Updating coupon');

      const couponId = req.params.id;

      if (!couponId) {
        return res.status(400).json({
          success: false,
          message: 'Coupon ID is required'
        });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nothing to update'
        });
      }

      const coupon = await CouponService.updateCoupon(couponId, req.body);

      res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        coupon
      });

    } catch (error) {
      console.error('❌ Error in updateCoupon:', error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * DELETE COUPON
   * DELETE /coupons/:id
   */
  static async deleteCoupon(req, res) {
    try {
      console.log('🔵 DELETE /coupons/:id - Deleting coupon');

      const couponId = req.params.id;

      if (!couponId) {
        return res.status(400).json({
          success: false,
          message: 'Coupon ID is required'
        });
      }

      const coupon = await CouponService.deleteCoupon(couponId);

      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully',
        coupon
      });

    } catch (error) {
      console.error('❌ Error in deleteCoupon:', error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * CHECK APPLICABLE COUPONS
   * POST /coupons/check/applicable
   * 
   * ✅ FIXED: Accepts 3 formats
   * Format 1: Direct array
   *   [{ product_id: "P1", price: 100, quantity: 2 }]
   * 
   * Format 2: With cartItems (YOUR FORMAT)
   *   { cartItems: [{ product_id: "P1", price: 100, quantity: 2 }] }
   * 
   * Format 3: With items
   *   { items: [{ product_id: "P1", price: 100, quantity: 2 }] }
   */
  static async getApplicableCoupons(req, res) {
    try {
      console.log('🔵 POST /coupons/check/applicable - Checking applicable coupons');
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      let cartItems = [];

      // ✅ FIXED: Handle multiple formats
      if (Array.isArray(req.body)) {
        // Format 1: Direct array
        cartItems = req.body;
        console.log('✓ Detected Format 1: Direct array');
      }
      else if (req.body && Array.isArray(req.body.cartItems)) {
        // Format 2: Object with cartItems property
        cartItems = req.body.cartItems;
        console.log('✓ Detected Format 2: cartItems object');
      }
      else if (req.body && Array.isArray(req.body.items)) {
        // Format 3: Object with items property
        cartItems = req.body.items;
        console.log('✓ Detected Format 3: items object');
      }
      else {
        // ❌ Invalid format
        return res.status(400).json({
          success: false,
          message: 'Invalid cart structure. Use one of these formats:',
          validFormats: {
            format1_directArray: [
              { product_id: 'PROD_001', price: 100, quantity: 2 }
            ],
            format2_cartItems: {
              cartItems: [
                { product_id: 'PROD_001', price: 100, quantity: 2 }
              ]
            },
            format3_items: {
              items: [
                { product_id: 'PROD_001', price: 100, quantity: 2 }
              ]
            }
          }
        });
      }

      // Validate cart is not empty
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty or invalid'
        });
      }

      // Validate each item has required fields
      const isValid = cartItems.every(item => 
        item.product_id && 
        typeof item.price === 'number' && 
        item.price >= 0 &&
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item. Each item must have: product_id, price (>= 0), quantity (> 0)',
          example: { 
            product_id: 'PROD_001', 
            price: 100, 
            quantity: 2 
          }
        });
      }

      console.log('✓ Cart items validated:', cartItems.length, 'items');

      // Get applicable coupons
      const applicableCoupons = await CouponService.getApplicableCoupons(cartItems);

      res.status(200).json({
        success: true,
        message: `Found ${applicableCoupons.length} applicable coupon(s)`,
        applicableCoupons,
        count: applicableCoupons.length
      });

    } catch (error) {
      console.error('❌ Error in getApplicableCoupons:', error.message);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  /**
   * APPLY COUPON TO CART
   * POST /coupons/:id/apply
   * 
   * ✅ FIXED: Accepts 3 formats (same as check/applicable)
   */
  static async applyCouponToCart(req, res) {
    try {
      console.log('🔵 POST /coupons/:id/apply - Applying coupon');
      console.log('Coupon ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const couponId = req.params.id;

      if (!couponId) {
        return res.status(400).json({
          success: false,
          message: 'Coupon ID is required'
        });
      }

      let cartItems = [];

      // ✅ FIXED: Handle multiple formats
      if (Array.isArray(req.body)) {
        // Format 1: Direct array
        cartItems = req.body;
        console.log('✓ Detected Format 1: Direct array');
      }
      else if (req.body && Array.isArray(req.body.cartItems)) {
        // Format 2: Object with cartItems property
        cartItems = req.body.cartItems;
        console.log('✓ Detected Format 2: cartItems object');
      }
      else if (req.body && Array.isArray(req.body.items)) {
        // Format 3: Object with items property
        cartItems = req.body.items;
        console.log('✓ Detected Format 3: items object');
      }
      else {
        // ❌ Invalid format
        return res.status(400).json({
          success: false,
          message: 'Invalid cart structure. Use one of these formats:',
          validFormats: {
            format1_directArray: [
              { product_id: 'PROD_001', price: 100, quantity: 2 }
            ],
            format2_cartItems: {
              cartItems: [
                { product_id: 'PROD_001', price: 100, quantity: 2 }
              ]
            },
            format3_items: {
              items: [
                { product_id: 'PROD_001', price: 100, quantity: 2 }
              ]
            }
          }
        });
      }

      // Validate cart is not empty
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty or invalid'
        });
      }

      // Validate each item
      const isValid = cartItems.every(item => 
        item.product_id && 
        typeof item.price === 'number' && 
        item.price >= 0 &&
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item. Each item must have: product_id, price (>= 0), quantity (> 0)',
          example: { 
            product_id: 'PROD_001', 
            price: 100, 
            quantity: 2 
          }
        });
      }

      console.log('✓ Cart items validated:', cartItems.length, 'items');

      // Apply coupon
      const result = await CouponService.applyCouponToCart(couponId, cartItems);

      res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        result
      });

    } catch (error) {
      console.error('❌ Error in applyCouponToCart:', error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('cannot be applied')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}

module.exports = CouponController;