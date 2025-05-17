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

// JWT strategy for admin authentication
const adminJwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
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
