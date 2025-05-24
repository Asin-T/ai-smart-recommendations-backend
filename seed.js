// ✅ Backend seed script: Add demo products to your MongoDB database
// This will make sure your frontend can display products from the live backend

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Optional: Clear existing products
    await Product.deleteMany();

    // Sample products
    const products = [
      {
        name: 'AI Assistant Notebook',
        category: 'Stationery',
        description: 'A notebook enhanced with smart recommendation notes.',
        price: 9.99,
        image_url: 'https://via.placeholder.com/300x300?text=Notebook',
        tags: ['notebook', 'stationery', 'ai']
      },
      {
        name: 'Smart Water Bottle',
        category: 'Gadgets',
        description: 'Keeps track of your hydration and sends smart alerts.',
        price: 29.95,
        image_url: 'https://via.placeholder.com/300x300?text=Water+Bottle',
        tags: ['health', 'water', 'smart']
      },
      {
        name: 'Ergonomic Keyboard',
        category: 'Accessories',
        description: 'Designed to keep you productive and pain-free.',
        price: 89.0,
        image_url: 'https://via.placeholder.com/300x300?text=Keyboard',
        tags: ['keyboard', 'office', 'ergonomic']
      }
    ];

    await Product.insertMany(products);
    console.log('✅ Products seeded successfully');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedProducts();
