// routes/seedRoute.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/seed', async (req, res) => {
  try {
    await Product.deleteMany();

    const products = [
      {
        name: 'AI Assistant Notebook',
        category: 'Stationery',
        description: 'Notebook enhanced with smart recommendation notes.',
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
    res.status(200).json({ message: '✅ Seed successful' });
  } catch (err) {
    res.status(500).json({ message: '❌ Seed failed', error: err.message });
  }
});

module.exports = router;
