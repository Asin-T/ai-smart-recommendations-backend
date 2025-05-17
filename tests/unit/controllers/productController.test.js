const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../../../src/models/Product');
const { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../../../src/controllers/productController');

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
  getPagination: jest.fn(() => ({ skip: 0, limit: 10 })),
}));

describe('Product Controller', () => {
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
    await Product.deleteMany({});
  });
  
  describe('getProducts', () => {
    it('should return all products with pagination', async () => {
      // Arrange
      await Product.create([
        {
          name: 'Product 1',
          category: 'Category A',
          description: 'Description 1',
          price: 99.99,
          tags: ['tag1', 'tag2']
        },
        {
          name: 'Product 2',
          category: 'Category B',
          description: 'Description 2',
          price: 149.99,
          tags: ['tag2', 'tag3']
        }
      ]);
      
      const req = {
        query: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getProducts(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.products).toHaveLength(2);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBe(2);
      expect(res.statusCode).toBe(200);
    });
    
    it('should filter products by category', async () => {
      // Arrange
      await Product.create([
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
      
      const req = {
        query: {
          category: 'Category A'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getProducts(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.products).toHaveLength(1);
      expect(res.data.products[0].name).toBe('Product 1');
      expect(res.statusCode).toBe(200);
    });
  });
  
  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Test Product',
        category: 'Test Category',
        description: 'Test Description',
        price: 99.99,
        tags: ['tag1', 'tag2']
      });
      
      const req = {
        params: {
          id: product._id
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getProductById(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.name).toBe('Test Product');
      expect(res.data.price).toBe(99.99);
      expect(res.statusCode).toBe(200);
    });
    
    it('should return error if product not found', async () => {
      // Arrange
      const req = {
        params: {
          id: new mongoose.Types.ObjectId()
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await getProductById(req, res);
      
      // Assert
      expect(res.message).toBe('Product not found');
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      const req = {
        body: {
          name: 'New Product',
          category: 'New Category',
          description: 'New Description',
          price: 199.99,
          tags: ['new', 'product']
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Act
      await createProduct(req, res);
      
      // Assert
      expect(res.data).toBeDefined();
      expect(res.data.name).toBe('New Product');
      expect(res.data.price).toBe(199.99);
      expect(res.statusCode).toBe(201);
      
      // Verify product was saved to database
      const product = await Product.findOne({ name: 'New Product' });
      expect(product).toBeDefined();
      expect(product.category).toBe('New Category');
    });
  });
  
  // Additional tests for updateProduct and deleteProduct would follow the same pattern
});
