/**
 * api.integration.test.js
 * 
 * Integration tests for complete API workflows
 * Tests end-to-end flows including database operations
 * 
 * Requirements:
 * - MongoDB must be running
 * - Test database must be available
 * 
 * Run: npm test -- api.integration.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import your actual app/routes
// Adjust paths based on your project structure
const couponRoutes = require('../src/routes/couponRoutes');
const Coupon = require('../src/models/Coupon');

// Create test app
const app = express();
app.use(express.json());
app.use('/coupons', couponRoutes);

// Setup and teardown
beforeAll(async () => {
  // Connect to test database (optional)
  // await mongoose.connect(process.env.TEST_MONGODB_URI);
});

afterAll(async () => {
  // Cleanup
  // await Coupon.deleteMany({});
  // await mongoose.connection.close();
});

describe('Coupon API Integration Tests', () => {

  // ═══════════════════════════════════════════════════════════
  // CREATE COUPON TESTS
  // ═══════════════════════════════════════════════════════════

  describe('POST /coupons - Create Coupon', () => {

    test('Should create cart-wise coupon successfully', async () => {
      const couponData = {
        code: `CART_${Date.now()}`,
        type: 'CART_WISE',
        discount: {
          type: 'PERCENTAGE',
          value: 10
        },
        is_active: true,
        conditions: {
          minimum_cart_value: 100
        }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.coupon.code).toBe(couponData.code);
      expect(response.body.coupon.type).toBe('CART_WISE');
    });

    test('Should create product-wise coupon successfully', async () => {
      const couponData = {
        code: `PROD_${Date.now()}`,
        type: 'PRODUCT_WISE',
        discount: {
          type: 'PERCENTAGE',
          value: 20
        },
        is_active: true,
        conditions: {
          applicable_products: ['PROD_001', 'PROD_002']
        }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.coupon.type).toBe('PRODUCT_WISE');
    });

    test('Should create BxGy coupon successfully', async () => {
      const couponData = {
        code: `BXGY_${Date.now()}`,
        type: 'BXGY',
        discount: {
          type: 'FIXED_AMOUNT',
          value: 0
        },
        is_active: true,
        conditions: {
          buy_quantity: 2,
          get_quantity: 1,
          buy_from: ['A', 'B', 'C'],
          get_from: ['D', 'E', 'F'],
          repetition_limit: 3
        }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.coupon.type).toBe('BXGY');
    });

    test('Should reject duplicate coupon code', async () => {
      const code = `DUP_${Date.now()}`;
      const couponData = {
        code,
        type: 'CART_WISE',
        discount: { type: 'PERCENTAGE', value: 10 },
        is_active: true,
        conditions: { minimum_cart_value: 100 }
      };

      // First creation
      await request(app).post('/coupons').send(couponData);

      // Second creation (should fail)
      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('Should reject empty body', async () => {
      const response = await request(app)
        .post('/coupons')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // RETRIEVE COUPON TESTS
  // ═══════════════════════════════════════════════════════════

  describe('GET /coupons - Retrieve Coupons', () => {

    let createdCouponId;

    beforeAll(async () => {
      // Create a coupon for testing
      const couponData = {
        code: `GET_TEST_${Date.now()}`,
        type: 'CART_WISE',
        discount: { type: 'PERCENTAGE', value: 10 },
        is_active: true,
        conditions: { minimum_cart_value: 100 }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      createdCouponId = response.body.coupon._id;
    });

    test('Should get all coupons', async () => {
      const response = await request(app)
        .get('/coupons');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('Should filter by type', async () => {
      const response = await request(app)
        .get('/coupons?type=CART_WISE');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach(coupon => {
        expect(coupon.type).toBe('CART_WISE');
      });
    });

    test('Should filter by active status', async () => {
      const response = await request(app)
        .get('/coupons?is_active=true');

      expect(response.status).toBe(200);
      response.body.data.forEach(coupon => {
        expect(coupon.is_active).toBe(true);
      });
    });

    test('Should get single coupon by ID', async () => {
      const response = await request(app)
        .get(`/coupons/${createdCouponId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.coupon._id).toBe(createdCouponId);
    });

    test('Should return 404 for non-existent coupon', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/coupons/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // UPDATE COUPON TESTS
  // ═══════════════════════════════════════════════════════════

  describe('PUT /coupons/:id - Update Coupon', () => {

    let couponId;

    beforeAll(async () => {
      const couponData = {
        code: `UPDATE_${Date.now()}`,
        type: 'CART_WISE',
        discount: { type: 'PERCENTAGE', value: 10 },
        is_active: true,
        conditions: { minimum_cart_value: 100 }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      couponId = response.body.coupon._id;
    });

    test('Should update discount value', async () => {
      const response = await request(app)
        .put(`/coupons/${couponId}`)
        .send({
          discount: {
            type: 'PERCENTAGE',
            value: 20
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.coupon.discount.value).toBe(20);
    });

    test('Should deactivate coupon', async () => {
      const response = await request(app)
        .put(`/coupons/${couponId}`)
        .send({ is_active: false });

      expect(response.status).toBe(200);
      expect(response.body.coupon.is_active).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // DELETE COUPON TESTS
  // ═══════════════════════════════════════════════════════════

  describe('DELETE /coupons/:id - Delete Coupon', () => {

    let couponId;

    beforeAll(async () => {
      const couponData = {
        code: `DELETE_${Date.now()}`,
        type: 'CART_WISE',
        discount: { type: 'PERCENTAGE', value: 10 },
        is_active: true,
        conditions: { minimum_cart_value: 100 }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      couponId = response.body.coupon._id;
    });

    test('Should delete coupon successfully', async () => {
      const response = await request(app)
        .delete(`/coupons/${couponId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Should return 404 when deleting non-existent coupon', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/coupons/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // CHECK APPLICABLE COUPONS TESTS
  // ═══════════════════════════════════════════════════════════

  describe('POST /coupons/check/applicable - Check Applicable Coupons', () => {

    beforeAll(async () => {
      // Create test coupons
      const coupons = [
        {
          code: `APPLICABLE_CART_${Date.now()}`,
          type: 'CART_WISE',
          discount: { type: 'PERCENTAGE', value: 10 },
          is_active: true,
          conditions: { minimum_cart_value: 100 }
        },
        {
          code: `APPLICABLE_PROD_${Date.now()}`,
          type: 'PRODUCT_WISE',
          discount: { type: 'PERCENTAGE', value: 20 },
          is_active: true,
          conditions: { applicable_products: ['PROD_001', 'PROD_002'] }
        }
      ];

      for (const coupon of coupons) {
        await request(app).post('/coupons').send(coupon);
      }
    });

    test('Should check applicable coupons with cartItems format', async () => {
      const cart = {
        cartItems: [
          { product_id: 'PROD_001', price: 100, quantity: 2 },
          { product_id: 'PROD_002', price: 50, quantity: 1 }
        ]
      };

      const response = await request(app)
        .post('/coupons/check/applicable')
        .send(cart);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.applicableCoupons)).toBe(true);
    });

    test('Should check applicable coupons with direct array format', async () => {
      const cart = [
        { product_id: 'PROD_001', price: 100, quantity: 2 },
        { product_id: 'PROD_002', price: 50, quantity: 1 }
      ];

      const response = await request(app)
        .post('/coupons/check/applicable')
        .send(cart);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Should reject empty cart', async () => {
      const response = await request(app)
        .post('/coupons/check/applicable')
        .send([]);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should reject invalid cart structure', async () => {
      const response = await request(app)
        .post('/coupons/check/applicable')
        .send({ invalid: 'format' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  // APPLY COUPON TESTS
  // ═══════════════════════════════════════════════════════════

  describe('POST /coupons/:id/apply - Apply Coupon', () => {

    let cartWiseCouponId;

    beforeAll(async () => {
      const couponData = {
        code: `APPLY_${Date.now()}`,
        type: 'CART_WISE',
        discount: { type: 'PERCENTAGE', value: 10 },
        is_active: true,
        conditions: { minimum_cart_value: 100 }
      };

      const response = await request(app)
        .post('/coupons')
        .send(couponData);

      cartWiseCouponId = response.body.coupon._id;
    });

    test('Should apply valid coupon to cart', async () => {
      const cart = {
        cartItems: [
          { product_id: 'PROD_001', price: 100, quantity: 1 },
          { product_id: 'PROD_002', price: 50, quantity: 1 }
        ]
      };

      const response = await request(app)
        .post(`/coupons/${cartWiseCouponId}/apply`)
        .send(cart);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.discount_amount).toBeGreaterThan(0);
    });

    test('Should reject apply with empty cart', async () => {
      const response = await request(app)
        .post(`/coupons/${cartWiseCouponId}/apply`)
        .send([]);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

  });

});