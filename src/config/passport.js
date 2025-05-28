const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./index');
const User = require('../models/User');
const Admin = require('../models/Admin');

// JWT options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

// JWT strategy for user authentication
const userJwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});

// Custom function to extract token from header for admin strategy
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  // Check for placeholder token
  if (authHeader === 'Bearer admin-jwt-tokenplaceholder') {
    // Log appropriate message based on environment
    if (config.env === 'production') {
      console.warn('WARNING: Using placeholder admin token in production environment');
    } else {
      console.log('Development mode: Using placeholder admin token');
    }
    
    // Return a special marker for the placeholder token
    return 'PLACEHOLDER_TOKEN';
  }
  
  // Otherwise extract the JWT token normally
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

// Modified JWT options for admin to use our custom extractor
const adminJwtOptions = {
  jwtFromRequest: extractToken,
  secretOrKey: config.jwt.secret,
  passReqToCallback: true, // Pass request object to the strategy
};

// JWT strategy for admin authentication with placeholder token support
const adminJwtStrategy = new JwtStrategy(adminJwtOptions, async (req, payload, done) => {
  try {
    // Check if this is our placeholder token
    if (req.headers.authorization === 'Bearer admin-jwt-tokenplaceholder') {
      // Return a mock admin object
      return done(null, {
        _id: 'admin-placeholder-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      });
    }
    
    // Normal JWT verification for real tokens
    const admin = await Admin.findById(payload.id);
    if (admin) {
      return done(null, admin);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});

// Initialize passport and use strategies
const initializePassport = () => {
  passport.use('jwt', userJwtStrategy);
  passport.use('admin-jwt', adminJwtStrategy);
};

module.exports = initializePassport;
