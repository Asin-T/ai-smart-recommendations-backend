// ✅ Updated Product.js (Mongoose Model) with compatibility for frontend image field
// — Preserves all original logic
// — Adds alias for imageUrl used by frontend

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image_url: {
      type: String,
      trim: true,
    },
    // ✅ Virtual field for compatibility with frontend "imageUrl"
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Create a virtual "imageUrl" field so frontend can use product.imageUrl
productSchema.virtual('imageUrl').get(function () {
  return this.image_url;
});

productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
