const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import config
const connectDB = require('./config/database');

// Import routes
const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(logger);  // Log all requests

// Routes
app.use('/coupons', couponRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Connect to database
connectDB();

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
