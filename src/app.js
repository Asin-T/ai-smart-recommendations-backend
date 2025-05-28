// ✅ Updated backend app.js with fixed CORS configuration
// — Fully preserves all original middleware and routes
// — Fixes CORS configuration to properly handle multiple origins

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configurations
const config = require('./config');
const connectDB = require('./config/db');
const initializePassport = require('./config/passport');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/validation');

// Import routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedRoute = require('./routes/seedRoute'); // ✅ NEW: seed route

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize Passport
initializePassport();

// CORS Configuration - Fixed to properly handle multiple origins
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Parse origins from config (could be string or array)
    let allowedOrigins = config.cors.origin;
    
    // If it's a string with commas, convert to array
    if (typeof allowedOrigins === 'string' && allowedOrigins.includes(',')) {
      allowedOrigins = allowedOrigins.split(',').map(origin => origin.trim());
    }
    
    // Check if origin is allowed
    if (Array.isArray(allowedOrigins)) {
      // Check against array of origins
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Check for wildcard domains
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp('^' + allowedOrigin.replace('*', '.*') + '$');
          return pattern.test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        return callback(null, true);
      }
    } else if (allowedOrigins === '*') {
      // Allow any origin
      return callback(null, true);
    } else if (origin === allowedOrigins) {
      // Single origin match
      return callback(null, true);
    }
    
    // If we get here, origin is not allowed
    callback(new Error('CORS not allowed'));
  },
  credentials: true
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', seedRoute); // ✅ NEW: Mount seed route under /api

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: config.env });
});

// Error handling middleware
app.use(errorHandler);

// Serve static assets in production
if (config.env === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  });
}

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
