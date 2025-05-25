// ✅ Updated seed.js with real working image URLs for all actual products

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Clear existing products
    await Product.deleteMany();

    const products = [
      {
        name: 'Smartphone X',
        category: 'Electronics',
        description: 'The latest Smartphone X with advanced AI camera and high-speed processor.',
        price: 799.99,
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
        tags: ['phone', 'smartphone', 'mobile']
      },
      {
        name: 'Wireless Headphones',
        category: 'Audio',
        description: 'Noise-canceling over-ear wireless headphones with 40-hour battery life.',
        price: 199.99,
        image_url: 'https://images.unsplash.com/photo-1657223144998-e5aa4fa2db7c?auto=format&fit=crop&w=600&q=80',
        tags: ['audio', 'headphones', 'wireless']
      },
      {
        name: 'Running Shoes',
        category: 'Footwear',
        description: 'Lightweight running shoes designed for maximum performance and comfort.',
        price: 119.99,
        image_url: 'https://images.unsplash.com/photo-1556306535-fc6684304af1?auto=format&fit=crop&w=600&q=80',
        tags: ['shoes', 'running', 'sports']
      },
      {
        name: 'Coffee Maker',
        category: 'Kitchen Appliances',
        description: 'Brews rich, flavorful coffee with easy controls and sleek design.',
        price: 89.99,
        image_url: 'https://images.unsplash.com/photo-1565452344518-47faca79dc69?auto=format&fit=crop&w=600&q=80',
        tags: ['coffee', 'appliance', 'kitchen']
      },
      {
        name: 'Smart Watch',
        category: 'Wearables',
        description: 'Monitor your fitness, calls, and messages with this smart wearable.',
        price: 249.99,
        image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
        tags: ['watch', 'wearable', 'smart']
      },
      {
        name: 'Bluetooth Speaker',
        category: 'Audio',
        description: 'Portable Bluetooth speaker with deep bass and waterproof build.',
        price: 59.99,
        image_url: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?auto=format&fit=crop&w=600&q=80',
        tags: ['audio', 'bluetooth', 'speaker']
      },
      {
        name: 'Laptop Pro',
        category: 'Computers',
        description: 'High-performance laptop for professionals and creators.',
        price: 1299.99,
        image_url: 'https://images.unsplash.com/photo-1672241860863-fab879bd4a07?auto=format&fit=crop&w=600&q=80',
        tags: ['laptop', 'computer', 'pro']
      },
      {
        name: 'Designer Backpack',
        category: 'Fashion',
        description: 'Stylish and durable backpack for daily and travel needs.',
        price: 149.99,
        image_url: 'https://images.unsplash.com/photo-1622560481979-f5b0174242a0?auto=format&fit=crop&w=600&q=80',
        tags: ['backpack', 'bag', 'designer']
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
