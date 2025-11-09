/**
 * DiscountCalculator.js
 * 
 * This file contains ALL discount calculation logic for different coupon types.
 * Each method handles a specific coupon type and returns standardized results.
 * 
 * These are pure functions with NO side effects:
 * - No database access
 * - No external API calls
 * - Only mathematical calculations
 * 
 * This makes the code:
 * ✓ Fast and efficient
 * ✓ Easy to test
 * ✓ Reusable everywhere
 */

class DiscountCalculator {

  /**
   * ==========================================
   * CART-WISE DISCOUNT
   * ==========================================
   * 
   * Purpose: Apply discount to entire cart when minimum value is met
   * 
   * Example:
   *   - Coupon: 10% off on carts over Rs. 100
   *   - Cart: Product A (Rs. 60) + Product B (Rs. 50) = Rs. 110
   *   - Discount: 10% of 110 = Rs. 11
   * 
   * @param {Array} cartItems - Array of items in cart
   *        Format: [{ product_id: "1", price: 100, quantity: 2 }, ...]
   * @param {Object} couponConditions - Coupon conditions
   *        Format: { minimum_cart_value: 100, maximum_discount: 500 }
   * @param {Object} discountConfig - How much discount to apply
   *        Format: { type: "PERCENTAGE", value: 10 } or { type: "FIXED_AMOUNT", value: 50 }
   * 
   * @returns {Object} Result object
   *   - applicable: Boolean - Is this coupon applicable?
   *   - discountAmount: Number - How much discount (if applicable)
   *   - reason: String - Why not applicable (if not applicable)
   *   - breakdownInfo: Object - Details about calculation
   */
  static calculateCartWiseDiscount(cartItems, couponConditions, discountConfig) {
    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Validate inputs
      // ═══════════════════════════════════════════════════════════
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return {
          applicable: false,
          reason: 'Cart is empty',
          discountAmount: 0
        };
      }

      if (!couponConditions || !discountConfig) {
        throw new Error('Invalid coupon conditions or discount config');
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 2: Calculate total cart value
      // ═══════════════════════════════════════════════════════════
      const cartTotal = cartItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);

      // ═══════════════════════════════════════════════════════════
      // STEP 3: Check if minimum cart value condition is met
      // ═══════════════════════════════════════════════════════════
      const minimumValue = couponConditions.minimum_cart_value || 0;

      if (cartTotal < minimumValue) {
        return {
          applicable: false,
          reason: `Cart total Rs.${this._roundPrice(cartTotal)} is below minimum Rs.${minimumValue}`,
          discountAmount: 0,
          breakdownInfo: {
            cartTotal: this._roundPrice(cartTotal),
            minimumRequired: minimumValue,
            shortfall: this._roundPrice(minimumValue - cartTotal)
          }
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: Calculate raw discount amount
      // ═══════════════════════════════════════════════════════════
      let discountAmount = 0;

      if (discountConfig.type === 'PERCENTAGE') {
        // Example: 10% of Rs. 100 = Rs. 10
        const percentage = discountConfig.value;
        discountAmount = (cartTotal * percentage) / 100;
      } 
      else if (discountConfig.type === 'FIXED_AMOUNT') {
        // Example: Flat Rs. 50 off
        discountAmount = discountConfig.value;
      } 
      else {
        throw new Error(`Unknown discount type: ${discountConfig.type}`);
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 5: Apply maximum discount cap if specified
      // ═══════════════════════════════════════════════════════════
      const maximumDiscount = couponConditions.maximum_discount;

      if (maximumDiscount && discountAmount > maximumDiscount) {
        const originalDiscount = discountAmount;
        discountAmount = maximumDiscount;

        return {
          applicable: true,
          discountAmount: this._roundPrice(discountAmount),
          reason: `Discount capped at maximum of Rs.${maximumDiscount}`,
          breakdownInfo: {
            cartTotal: this._roundPrice(cartTotal),
            discountType: discountConfig.type,
            discountValue: discountConfig.value,
            calculatedDiscount: this._roundPrice(originalDiscount),
            maximumCap: maximumDiscount,
            finalDiscount: this._roundPrice(discountAmount)
          }
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 6: Round to 2 decimal places
      // ═══════════════════════════════════════════════════════════
      discountAmount = this._roundPrice(discountAmount);

      // ═══════════════════════════════════════════════════════════
      // STEP 7: Return success result
      // ═══════════════════════════════════════════════════════════
      return {
        applicable: true,
        discountAmount: discountAmount,
        breakdownInfo: {
          cartTotal: this._roundPrice(cartTotal),
          discountType: discountConfig.type,
          discountValue: discountConfig.value,
          finalDiscount: discountAmount,
          finalAmount: this._roundPrice(cartTotal - discountAmount)
        }
      };

    } catch (error) {
      console.error('Error in calculateCartWiseDiscount:', error.message);
      return {
        applicable: false,
        reason: `Calculation error: ${error.message}`,
        discountAmount: 0
      };
    }
  }


  /**
   * ==========================================
   * PRODUCT-WISE DISCOUNT
   * ==========================================
   * 
   * Purpose: Apply discount only to specific products in the cart
   * 
   * Example:
   *   - Coupon: 20% off on Products A and C only
   *   - Cart: 
   *     * Product A: Rs. 100 × 2 = Rs. 200 (DISCOUNT APPLIED)
   *     * Product B: Rs. 50 × 1 = Rs. 50 (NO DISCOUNT)
   *     * Product C: Rs. 75 × 1 = Rs. 75 (DISCOUNT APPLIED)
   *   - Discount on A: 20% of 200 = Rs. 40
   *   - Discount on C: 20% of 75 = Rs. 15
   *   - Total: Rs. 55
   * 
   * @param {Array} cartItems - Items in cart
   * @param {Array} applicableProducts - Product IDs eligible for discount
   * @param {Object} discountConfig - Discount details
   * 
   * @returns {Object} Result object
   */
  static calculateProductWiseDiscount(cartItems, applicableProducts, discountConfig) {
    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Validate inputs
      // ═══════════════════════════════════════════════════════════
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return {
          applicable: false,
          reason: 'Cart is empty',
          discountAmount: 0
        };
      }

      if (!applicableProducts || !Array.isArray(applicableProducts) || applicableProducts.length === 0) {
        return {
          applicable: false,
          reason: 'No applicable products defined for this coupon',
          discountAmount: 0
        };
      }

      if (!discountConfig) {
        throw new Error('Invalid discount config');
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 2: Loop through cart and calculate discounts
      // ═══════════════════════════════════════════════════════════
      let totalDiscount = 0;
      const discountedItems = [];

      cartItems.forEach(item => {
        // Check if this product ID is in the applicable list
        if (applicableProducts.includes(item.product_id)) {
          const itemTotal = item.price * item.quantity;
          let itemDiscount = 0;

          if (discountConfig.type === 'PERCENTAGE') {
            // Example: 20% of (Rs. 100 × 2) = Rs. 40
            itemDiscount = (itemTotal * discountConfig.value) / 100;
          } 
          else if (discountConfig.type === 'FIXED_AMOUNT') {
            // Example: Rs. 50 off per item × 2 items = Rs. 100
            itemDiscount = discountConfig.value * item.quantity;
          }

          totalDiscount += itemDiscount;

          // Track which items got discounted
          discountedItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            itemTotal: itemTotal,
            discount: this._roundPrice(itemDiscount)
          });
        }
      });

      // ═══════════════════════════════════════════════════════════
      // STEP 3: Check if any discount was applied
      // ═══════════════════════════════════════════════════════════
      if (totalDiscount === 0) {
        return {
          applicable: false,
          reason: 'No applicable products found in your cart',
          discountAmount: 0,
          breakdownInfo: {
            applicableProducts: applicableProducts,
            cartProducts: cartItems.map(item => item.product_id),
            message: 'Cart does not contain any of the eligible products'
          }
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: Return success result
      // ═══════════════════════════════════════════════════════════
      totalDiscount = this._roundPrice(totalDiscount);

      return {
        applicable: true,
        discountAmount: totalDiscount,
        breakdownInfo: {
          discountType: discountConfig.type,
          discountValue: discountConfig.value,
          discountedItems: discountedItems,
          totalDiscount: totalDiscount
        }
      };

    } catch (error) {
      console.error('Error in calculateProductWiseDiscount:', error.message);
      return {
        applicable: false,
        reason: `Calculation error: ${error.message}`,
        discountAmount: 0
      };
    }
  }


  /**
   * ==========================================
   * BXGY DISCOUNT (Buy X Get Y Free)
   * ==========================================
   * 
   * Purpose: "Buy X products from array A, get Y products from array B free"
   * 
   * Example 1: Buy 2 Get 1 Free (no repetition limit)
   *   - Coupon: Buy 2 from [A, B, C], Get 1 from [D, E, F] free
   *   - Cart: A (qty 2), D (Rs. 500), E (Rs. 300)
   *   - Logic:
   *     * Count buy items: 2 (enough)
   *     * Times applicable: 2 ÷ 2 = 1 time
   *     * Free items needed: 1 × 1 = 1 item
   *     * Pick highest priced: D (Rs. 500)
   *   - Discount: Rs. 500
   * 
   * Example 2: Buy 2 Get 1 Free (with repetition_limit=3)
   *   - Cart: A (qty 6), D (Rs. 500), E (Rs. 400), F (Rs. 300)
   *   - Logic:
   *     * Count buy items: 6
   *     * Times applicable: 6 ÷ 2 = 3
   *     * Apply limit: min(3, 3) = 3 times
   *     * Free items needed: 3 × 1 = 3 items
   *     * Give 3 most expensive free: D (500) + E (400) + F (300)
   *   - Discount: Rs. 1,200
   * 
   * @param {Array} cartItems - Items in cart
   * @param {Number} buyQuantity - How many items to buy (e.g., 2)
   * @param {Number} getQuantity - How many items to get free (e.g., 1)
   * @param {Array} buyArray - Product IDs to buy from
   * @param {Array} getArray - Product IDs to get free from
   * @param {Number} repetitionLimit - Max times this coupon applies
   * 
   * @returns {Object} Result object
   */
  static calculateBxGyDiscount(cartItems, buyQuantity, getQuantity, buyArray, getArray, repetitionLimit) {
    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Validate inputs
      // ═══════════════════════════════════════════════════════════
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return {
          applicable: false,
          reason: 'Cart is empty',
          discountAmount: 0
        };
      }

      if (!buyArray || !Array.isArray(buyArray) || buyArray.length === 0) {
        return {
          applicable: false,
          reason: 'No products defined in buy array',
          discountAmount: 0
        };
      }

      if (!getArray || !Array.isArray(getArray) || getArray.length === 0) {
        return {
          applicable: false,
          reason: 'No products defined in get array',
          discountAmount: 0
        };
      }

      if (!buyQuantity || !getQuantity) {
        throw new Error('Invalid buy or get quantity');
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 2: Count items from buy_array in the cart
      // ═══════════════════════════════════════════════════════════
      let buyCount = 0;
      const buyItems = [];

      cartItems.forEach(item => {
        if (buyArray.includes(item.product_id)) {
          buyCount += item.quantity;
          buyItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          });
        }
      });

      // ═══════════════════════════════════════════════════════════
      // STEP 3: Check if we have enough items to buy
      // ═══════════════════════════════════════════════════════════
      if (buyCount < buyQuantity) {
        return {
          applicable: false,
          reason: `Need at least ${buyQuantity} items from buy array, but found ${buyCount}`,
          discountAmount: 0,
          breakdownInfo: {
            buyArray: buyArray,
            buyQuantityRequired: buyQuantity,
            buyQuantityFound: buyCount,
            shortfall: buyQuantity - buyCount,
            buyItemsInCart: buyItems
          }
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: Calculate how many times we can apply this coupon
      // ═══════════════════════════════════════════════════════════
      // If buy 2, get 1, and we have 6 items: 6 ÷ 2 = 3 times
      const timesApplicable = Math.floor(buyCount / buyQuantity);

      // But limit to maximum repetitions (e.g., can apply max 3 times)
      const timesToApply = Math.min(timesApplicable, repetitionLimit || timesApplicable);

      // ═══════════════════════════════════════════════════════════
      // STEP 5: Get items from get_array that are eligible for free
      // ═══════════════════════════════════════════════════════════
      let getItems = cartItems.filter(item => getArray.includes(item.product_id));

      if (getItems.length === 0) {
        return {
          applicable: false,
          reason: 'No eligible items found in cart to get for free',
          discountAmount: 0,
          breakdownInfo: {
            getArray: getArray,
            cartProducts: cartItems.map(item => item.product_id)
          }
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 6: Sort items by price (highest first)
      // ═══════════════════════════════════════════════════════════
      // Give the most expensive items free to maximize customer benefit
      getItems.sort((a, b) => b.price - a.price);

      // ═══════════════════════════════════════════════════════════
      // STEP 7: Calculate total free items
      // ═══════════════════════════════════════════════════════════
      const freeItemsNeeded = timesToApply * getQuantity;
      let totalDiscount = 0;
      let freeItemsGiven = 0;
      const freeItemsGivenDetails = [];

      // Iterate through get_items and mark them as free
      getItems.forEach(item => {
        // Stop if we've already given enough free items
        if (freeItemsGiven >= freeItemsNeeded) {
          return;
        }

        // How many of this item can we give free?
        const freeQuantity = Math.min(
          item.quantity,
          freeItemsNeeded - freeItemsGiven
        );

        const discount = freeQuantity * item.price;
        totalDiscount += discount;
        freeItemsGiven += freeQuantity;

        freeItemsGivenDetails.push({
          product_id: item.product_id,
          quantity: freeQuantity,
          price: item.price,
          discount: this._roundPrice(discount)
        });
      });

      // ═══════════════════════════════════════════════════════════
      // STEP 8: Round and return result
      // ═══════════════════════════════════════════════════════════
      totalDiscount = this._roundPrice(totalDiscount);

      return {
        applicable: true,
        discountAmount: totalDiscount,
        breakdownInfo: {
          buyQuantityRequired: buyQuantity,
          buyQuantityFound: buyCount,
          getQuantityPerApplication: getQuantity,
          timesApplicable: timesApplicable,
          repetitionLimit: repetitionLimit,
          timesApplied: timesToApply,
          totalFreeItemsGiven: freeItemsGiven,
          freeItemsGivenDetails: freeItemsGivenDetails,
          totalDiscount: totalDiscount
        }
      };

    } catch (error) {
      console.error('Error in calculateBxGyDiscount:', error.message);
      return {
        applicable: false,
        reason: `Calculation error: ${error.message}`,
        discountAmount: 0
      };
    }
  }


  /**
   * ==========================================
   * HELPER METHODS
   * ==========================================
   */

  /**
   * Round price to 2 decimal places
   * 
   * Why? Prices like Rs. 10.5067 should be Rs. 10.51
   * 
   * Example:
   *   Input: 10.5067
   *   Process:
   *     - Multiply by 100: 1050.67
   *     - Round: 1051
   *     - Divide by 100: 10.51
   *   Output: 10.51
   * 
   * @param {Number} price - Price to round
   * @returns {Number} Rounded price with 2 decimals
   */
  static _roundPrice(price) {
    if (typeof price !== 'number') {
      return 0;
    }
    return Math.round(price * 100) / 100;
  }


  /**
   * Validate cart item structure
   * 
   * Required fields:
   * - product_id: String or Number
   * - price: Number (must be >= 0)
   * - quantity: Number (must be > 0)
   * 
   * @param {Object} item - Cart item to validate
   * @returns {Boolean} Is valid?
   */
  static _isValidCartItem(item) {
    return item &&
           item.product_id &&
           typeof item.price === 'number' &&
           item.price >= 0 &&
           typeof item.quantity === 'number' &&
           item.quantity > 0;
  }


  /**
   * Calculate cart total
   * 
   * @param {Array} cartItems - Items in cart
   * @returns {Number} Total cart value
   */
  static calculateCartTotal(cartItems) {
    if (!cartItems || !Array.isArray(cartItems)) {
      return 0;
    }

    return this._roundPrice(
      cartItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 0));
      }, 0)
    );
  }

}

module.exports = DiscountCalculator;