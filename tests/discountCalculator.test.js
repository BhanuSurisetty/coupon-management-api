/**
 * discountCalculator.test.js
 * 
 * Unit tests for DiscountCalculator using Jest
 * Tests all discount calculation scenarios
 * 
 * Run: npm test
 */

const DiscountCalculator = require('../src/services/discountCalculator');

describe('DiscountCalculator', () => {

  // ═══════════════════════════════════════════════════════════
  // CART-WISE DISCOUNT TESTS
  // ═══════════════════════════════════════════════════════════

  describe('calculateCartWiseDiscount', () => {

    test('Should apply 10% discount when cart exceeds minimum', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 1 },
        { product_id: 'B', price: 50, quantity: 1 }
      ];

      const conditions = { minimum_cart_value: 100 };
      const discount = { type: 'PERCENTAGE', value: 10 };

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(15); // 10% of 150
    });

    test('Should NOT apply discount when cart below minimum', () => {
      const cartItems = [
        { product_id: 'A', price: 50, quantity: 1 }
      ];

      const conditions = { minimum_cart_value: 100 };
      const discount = { type: 'PERCENTAGE', value: 10 };

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
      expect(result.reason).toContain('below minimum');
    });

    test('Should apply fixed amount discount', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 1 },
        { product_id: 'B', price: 100, quantity: 1 }
      ];

      const conditions = { minimum_cart_value: 100 };
      const discount = { type: 'FIXED_AMOUNT', value: 50 };

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(50);
    });

    test('Should cap discount at maximum', () => {
      const cartItems = [
        { product_id: 'A', price: 10000, quantity: 1 }
      ];

      const conditions = { 
        minimum_cart_value: 100,
        maximum_discount: 500
      };
      const discount = { type: 'PERCENTAGE', value: 20 }; // Would be 2000

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(500); // Capped at 500
    });

    test('Should return 0 discount for empty cart', () => {
      const cartItems = [];
      const conditions = { minimum_cart_value: 100 };
      const discount = { type: 'PERCENTAGE', value: 10 };

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('Should round discount to 2 decimals', () => {
      const cartItems = [
        { product_id: 'A', price: 33.33, quantity: 1 }
      ];

      const conditions = { minimum_cart_value: 1 };
      const discount = { type: 'PERCENTAGE', value: 33 }; // 10.9989

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        conditions,
        discount
      );

      expect(typeof result.discountAmount).toBe('number');
      // Check it has at most 2 decimals
      expect(result.discountAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // PRODUCT-WISE DISCOUNT TESTS
  // ═══════════════════════════════════════════════════════════

  describe('calculateProductWiseDiscount', () => {

    test('Should apply discount to applicable products only', () => {
      const cartItems = [
        { product_id: 'PROD_001', price: 100, quantity: 2 },
        { product_id: 'PROD_002', price: 50, quantity: 1 },
        { product_id: 'PROD_003', price: 75, quantity: 1 }
      ];

      const applicableProducts = ['PROD_001', 'PROD_003'];
      const discount = { type: 'PERCENTAGE', value: 20 };

      const result = DiscountCalculator.calculateProductWiseDiscount(
        cartItems,
        applicableProducts,
        discount
      );

      expect(result.applicable).toBe(true);
      // PROD_001: 20% of 200 = 40
      // PROD_003: 20% of 75 = 15
      // Total: 55
      expect(result.discountAmount).toBe(55);
    });

    test('Should NOT apply discount when no applicable products in cart', () => {
      const cartItems = [
        { product_id: 'PROD_001', price: 100, quantity: 1 }
      ];

      const applicableProducts = ['PROD_002', 'PROD_003'];
      const discount = { type: 'PERCENTAGE', value: 20 };

      const result = DiscountCalculator.calculateProductWiseDiscount(
        cartItems,
        applicableProducts,
        discount
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('Should apply fixed amount discount per item', () => {
      const cartItems = [
        { product_id: 'PROD_001', price: 100, quantity: 2 },
        { product_id: 'PROD_002', price: 50, quantity: 1 }
      ];

      const applicableProducts = ['PROD_001'];
      const discount = { type: 'FIXED_AMOUNT', value: 50 };

      const result = DiscountCalculator.calculateProductWiseDiscount(
        cartItems,
        applicableProducts,
        discount
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(100); // 50 × 2 items
    });

    test('Should return 0 for empty cart', () => {
      const cartItems = [];
      const applicableProducts = ['PROD_001'];
      const discount = { type: 'PERCENTAGE', value: 20 };

      const result = DiscountCalculator.calculateProductWiseDiscount(
        cartItems,
        applicableProducts,
        discount
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // BXGY DISCOUNT TESTS
  // ═══════════════════════════════════════════════════════════

  describe('calculateBxGyDiscount', () => {

    test('Should apply BxGy discount: Buy 2 Get 1 Free', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 2 },
        { product_id: 'D', price: 500, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateBxGyDiscount(
        cartItems,
        2,                          // buyQuantity
        1,                          // getQuantity
        ['A', 'B', 'C'],            // buyArray
        ['D', 'E', 'F'],            // getArray
        10                          // repetitionLimit
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(500); // D costs 500, given free
      expect(result.breakdownInfo.timesApplied).toBe(1);
    });

    test('Should respect repetition limit in BxGy', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 6 },
        { product_id: 'D', price: 500, quantity: 1 },
        { product_id: 'E', price: 400, quantity: 1 },
        { product_id: 'F', price: 300, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateBxGyDiscount(
        cartItems,
        2,                          // buyQuantity
        1,                          // getQuantity
        ['A', 'B', 'C'],            // buyArray
        ['D', 'E', 'F'],            // getArray
        3                           // repetitionLimit
      );

      expect(result.applicable).toBe(true);
      expect(result.breakdownInfo.timesApplied).toBe(3);
      // Should give 3 most expensive items free: D(500) + E(400) + F(300) = 1200
      expect(result.discountAmount).toBe(1200);
    });

    test('Should NOT apply BxGy when insufficient buy items', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 1 },
        { product_id: 'D', price: 500, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateBxGyDiscount(
        cartItems,
        2,                          // Need 2, but have only 1
        1,
        ['A', 'B'],
        ['D', 'E'],
        10
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
      expect(result.reason).toContain('Need at least 2');
    });

    test('Should NOT apply BxGy when no get items available', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 2 }
      ];

      const result = DiscountCalculator.calculateBxGyDiscount(
        cartItems,
        2,
        1,
        ['A', 'B'],
        ['D', 'E'],  // These not in cart
        10
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('Should prioritize highest priced items as free', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 2 },
        { product_id: 'D', price: 100, quantity: 1 },
        { product_id: 'E', price: 500, quantity: 1 }, // Highest priced
        { product_id: 'F', price: 200, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateBxGyDiscount(
        cartItems,
        2,
        1,
        ['A', 'B'],
        ['D', 'E', 'F'],
        1
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(500); // E (most expensive) given free
    });

  });

  // ═══════════════════════════════════════════════════════════
  // HELPER METHOD TESTS
  // ═══════════════════════════════════════════════════════════

  describe('Helper Methods', () => {

    test('calculateCartTotal should sum all items correctly', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 2 },
        { product_id: 'B', price: 50, quantity: 3 }
      ];

      const total = DiscountCalculator.calculateCartTotal(cartItems);

      expect(total).toBe(350); // (100×2) + (50×3)
    });

    test('calculateCartTotal should handle empty cart', () => {
      const total = DiscountCalculator.calculateCartTotal([]);
      expect(total).toBe(0);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASES & ERROR HANDLING
  // ═══════════════════════════════════════════════════════════

  describe('Edge Cases', () => {

    test('Should handle null values gracefully', () => {
      const result = DiscountCalculator.calculateCartWiseDiscount(
        null,
        { minimum_cart_value: 100 },
        { type: 'PERCENTAGE', value: 10 }
      );

      expect(result.applicable).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('Should handle negative prices gracefully', () => {
      const cartItems = [
        { product_id: 'A', price: -100, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        { minimum_cart_value: 100 },
        { type: 'PERCENTAGE', value: 10 }
      );

      expect(result.applicable).toBe(false);
    });

    test('Should handle zero quantity', () => {
      const cartItems = [
        { product_id: 'A', price: 100, quantity: 0 }
      ];

      const total = DiscountCalculator.calculateCartTotal(cartItems);
      expect(total).toBe(0);
    });

    test('Should handle very large discounts', () => {
      const cartItems = [
        { product_id: 'A', price: 1000000, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        { minimum_cart_value: 1 },
        { type: 'PERCENTAGE', value: 99 }
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(990000);
    });

    test('Should handle very small decimals', () => {
      const cartItems = [
        { product_id: 'A', price: 0.01, quantity: 1 }
      ];

      const result = DiscountCalculator.calculateCartWiseDiscount(
        cartItems,
        { minimum_cart_value: 0.01 },
        { type: 'PERCENTAGE', value: 50 }
      );

      expect(result.applicable).toBe(true);
      expect(result.discountAmount).toBe(0.01);
    });

  });

});