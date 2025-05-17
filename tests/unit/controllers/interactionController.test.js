const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Interaction = require('../../../src/models/Interaction');
const User = require('../../../src/models/User');
const Product = require('../../../src/models/Product');
const { 
  recordInteraction,
  getInteractionsByUser,
  getInteractionsByProduct,
  getInteractionStats
} = require('../../../src/controllers/interactionController');

// Mock dependencies
jest.mock('../../../src/utils/helpers', () => ({
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
  getPagination: jest.fn(() => ({ skip: 0, limit: 20 })),
}));

describe('Interaction Controller', () => {
  let mongoServer;
  let testUser;
  let testProduct;
  
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
  
  // Create test user and product before each test
  beforeEach(async () => {
    await Interaction.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    testProduct = await Product.create({
      name: 'Test Product',
      category: 'Test Category',
      price: 99.99
    });
  });
  
  describe('recordInteraction', () => {
    it('should record a new interaction successfully', async () => {
      // Arrange
      const req = {
        user: { _id: testUser._id },
        body: {
          product_id: testProduct._id,
          interaction_type: 'view',
          metadata: { source: 'homepage' }
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await recordInteraction(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.user_id.toString()).toBe(testUser._id.toString());
      expect(res.data.product_id.toString()).toBe(testProduct._id.toString());
      expect(res.data.interaction_type).toBe('view');
      expect(res.data.metadata).toEqual({ source: 'homepage' });
      expect(res.statusCode).toBe(201);
      
      // Verify interaction was saved to database
      const interaction = await Interaction.findOne({ 
        user_id: testUser._id,
        product_id: testProduct._id
      });
      expect(interaction).toBeDefined();
      expect(interaction.interaction_type).toBe('view');
    });
  });
  
  describe('getInteractionsByUser', () => {
    it('should return interactions for a specific user', async () => {
      // Arrange
      await Interaction.create([
        {
          user_id: testUser._id,
          product_id: testProduct._id,
          interaction_type: 'view',
          timestamp: new Date()
        },
        {
          user_id: testUser._id,
          product_id: testProduct._id,
          interaction_type: 'like',
          timestamp: new Date()
        }
      ]);
      
      const req = {
        params: {
          userId: testUser._id
        },
        query: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getInteractionsByUser(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.interactions).toHaveLength(2);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBe(2);
      expect(res.statusCode).toBe(200);
    });
  });
  
  describe('getInteractionsByProduct', () => {
    it('should return interactions for a specific product', async () => {
      // Arrange
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      });
      
      await Interaction.create([
        {
          user_id: testUser._id,
          product_id: testProduct._id,
          interaction_type: 'view',
          timestamp: new Date()
        },
        {
          user_id: anotherUser._id,
          product_id: testProduct._id,
          interaction_type: 'purchase',
          timestamp: new Date()
        }
      ]);
      
      const req = {
        params: {
          productId: testProduct._id
        },
        query: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getInteractionsByProduct(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.interactions).toHaveLength(2);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBe(2);
      expect(res.statusCode).toBe(200);
    });
  });
  
  // Additional tests for getInteractionStats would follow the same pattern
});
