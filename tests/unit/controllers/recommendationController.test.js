const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Recommendation = require('../../../src/models/Recommendation');
const User = require('../../../src/models/User');
const Product = require('../../../src/models/Product');
const Interaction = require('../../../src/models/Interaction');
const { 
  getUserRecommendations,
  getSimilarProducts,
  getTrendingProducts
} = require('../../../src/controllers/recommendationController');

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
  }
}));

// Mock AI modules
jest.mock('../../../src/ai/collaborativeFiltering', () => ({
  getRecommendations: jest.fn().mockResolvedValue(['product1', 'product2'])
}));

jest.mock('../../../src/ai/contentBasedFiltering', () => ({
  getRecommendations: jest.fn().mockResolvedValue(['product3', 'product4']),
  getSimilarProducts: jest.fn().mockResolvedValue(['product5', 'product6'])
}));

jest.mock('../../../src/ai/hybridRecommendation', () => ({
  getRecommendations: jest.fn().mockResolvedValue(['product7', 'product8'])
}));

describe('Recommendation Controller', () => {
  let mongoServer;
  let testUser;
  let testProducts = [];
  
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
  
  // Create test user and products before each test
  beforeEach(async () => {
    await Recommendation.deleteMany({});
    await Interaction.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Create test products
    testProducts = await Product.create([
      {
        name: 'Product 1',
        category: 'Category A',
        price: 99.99
      },
      {
        name: 'Product 2',
        category: 'Category B',
        price: 149.99
      }
    ]);
  });
  
  describe('getUserRecommendations', () => {
    it('should return cached recommendations if available', async () => {
      // Arrange
      const productIds = testProducts.map(p => p._id);
      
      // Create a cached recommendation
      await Recommendation.create({
        user_id: testUser._id,
        product_ids: productIds,
        recommendation_type: 'hybrid',
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // Expires in 1 hour
      });
      
      const req = {
        params: {
          userId: testUser._id
        },
        user: { _id: testUser._id },
        query: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getUserRecommendations(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.recommendations).toHaveLength(2);
      expect(res.data.source).toBe('cached');
      expect(res.statusCode).toBe(200);
    });
    
    it('should generate new recommendations if cache expired', async () => {
      // Arrange
      const req = {
        params: {
          userId: testUser._id
        },
        user: { _id: testUser._id },
        query: {
          type: 'hybrid'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getUserRecommendations(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.source).toBe('generated');
      expect(res.statusCode).toBe(200);
    });
  });
  
  describe('getSimilarProducts', () => {
    it('should return similar products for a given product', async () => {
      // Arrange
      const req = {
        params: {
          productId: testProducts[0]._id
        },
        query: {
          limit: 5
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getSimilarProducts(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
    });
    
    it('should return error if product not found', async () => {
      // Arrange
      const req = {
        params: {
          productId: new mongoose.Types.ObjectId()
        },
        query: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getSimilarProducts(req, res);
      
      // Assert
      expect(res.message).toBe('Product not found');
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('getTrendingProducts', () => {
    it('should return trending products based on interactions', async () => {
      // Arrange
      // Create some interactions
      await Interaction.create([
        {
          user_id: testUser._id,
          product_id: testProducts[0]._id,
          interaction_type: 'view',
          timestamp: new Date()
        },
        {
          user_id: testUser._id,
          product_id: testProducts[0]._id,
          interaction_type: 'like',
          timestamp: new Date()
        },
        {
          user_id: testUser._id,
          product_id: testProducts[1]._id,
          interaction_type: 'view',
          timestamp: new Date()
        }
      ]);
      
      const req = {
        query: {
          limit: 10,
          days: 7
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getTrendingProducts(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
    });
  });
});
