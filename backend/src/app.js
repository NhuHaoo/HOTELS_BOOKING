const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const hotelRoutes = require('./routes/hotel.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const aiRoutes = require('./routes/ai.routes');
const uploadRoutes = require('./routes/upload.routes');
const weatherRoutes = require('./routes/weather.routes');
const promotionRoutes = require('./routes/promotion.routes');

// ✅ Manager routes
const managerRoutes = require('./routes/manager.routes');
const managerRoomRoutes = require('./routes/manager.rooms.routes');

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json({ limit: config.uploadLimit }));
app.use(express.urlencoded({ extended: true, limit: config.uploadLimit }));

// CORS middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Booking API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API status route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API endpoints are working',
    endpoints: {
      auth: '/api/auth',
      rooms: '/api/rooms',
      hotels: '/api/hotels',
      bookings: '/api/bookings',
      reviews: '/api/reviews',
      favorites: '/api/favorites',
      payments: '/api/payments',
      admin: '/api/admin',
      ai: '/api/ai',
      upload: '/api/upload',
      weather: '/api/weather',
      manager: '/api/manager',
      managerRooms: '/api/manager/rooms'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/promotions', promotionRoutes);

// ✅ Manager main (dashboard/bookings/reviews...)
app.use('/api/manager', managerRoutes);

// ✅ Manager rooms CRUD
app.use('/api/manager/rooms', managerRoomRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
