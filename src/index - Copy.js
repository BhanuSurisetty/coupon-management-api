const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/coupons', couponRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✓ MongoDB Connected');
})
.catch((err) => {
  console.error('✗ MongoDB Error:', err.message);
  process.exit(1);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Test health: http://localhost:${PORT}/health`);
});
