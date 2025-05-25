// ✅ Updated seedRoute.js aligned with seed.js and real product images

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/seed', async (req, res) => {
  try {
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
    res.status(200).json({ success: true, message: '✅ Products seeded successfully' });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    res.status(500).json({ success: false, message: '❌ Seeding failed', error });
  }
});

module.exports = router;
