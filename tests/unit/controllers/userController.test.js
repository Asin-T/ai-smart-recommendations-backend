const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/User');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  deleteUserAccount 
} = require('../../../src/controllers/userController');

// Mock dependencies
jest.mock('../../../src/utils/helpers', () => ({
  generateToken: jest.fn(() => 'test-token'),
  responseHelpers: {
    success: jest.fn((res, data, statusCode) => {
      res.statusCode = statusCode || 200;
      res.data = data;
      return res;
    }),
    error: jest.fn((res, message, statusCode) => {
      res.statusCode = statusCode || 400;
      res.message = message;
      return res;
    }),
  },
}));

describe('User Controller', () => {
  let mongoServer;
  
  // Setup in-memory MongoDB server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Clear database between tests
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await registerUser(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.name).toBe('Test User');
      expect(res.data.email).toBe('test@example.com');
      expect(res.data.token).toBe('test-token');
      expect(res.statusCode).toBe(201);
      
      // Verify user was saved to database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
    });
    
    it('should return error if user already exists', async () => {
      // Arrange
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });
      
      const req = {
        body: {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await registerUser(req, res);
      
      // Assert
      expect(res.message).toBe('User already exists');
      expect(res.statusCode).toBe(400);
    });
  });
  
  describe('loginUser', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      
      await user.save();
      
      // Mock comparePassword method
      User.prototype.comparePassword = jest.fn().mockResolvedValue(true);
      
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await loginUser(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.email).toBe('test@example.com');
      expect(res.data.token).toBe('test-token');
      expect(res.statusCode).toBe(200);
    });
    
    it('should return error with invalid credentials', async () => {
      // Arrange
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      
      await user.save();
      
      // Mock comparePassword method to return false
      User.prototype.comparePassword = jest.fn().mockResolvedValue(false);
      
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await loginUser(req, res);
      
      // Assert
      expect(res.message).toBe('Invalid email or password');
      expect(res.statusCode).toBe(401);
    });
  });
  
  describe('getUserProfile', () => {
    it('should return user profile for authenticated user', async () => {
      // Arrange
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      
      const req = {
        user: { _id: user._id },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getUserProfile(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.name).toBe('Test User');
      expect(res.data.email).toBe('test@example.com');
      expect(res.statusCode).toBe(200);
    });
    
    it('should return error if user not found', async () => {
      // Arrange
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getUserProfile(req, res);
      
      // Assert
      expect(res.message).toBe('User not found');
      expect(res.statusCode).toBe(404);
    });
  });
  
  // Additional tests for updateUserProfile and deleteUserAccount would follow the same pattern
});
