const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    product_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      required: [true, 'Product IDs are required'],
    },
    recommendation_type: {
      type: String,
      enum: ['collaborative', 'content-based', 'hybrid', 'trending'],
      default: 'hybrid',
    },
    score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    generated_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      default: function() {
        // Default expiration is 24 hours after generation
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
  },
  {
    timestamps: false,
  }
);

// Index for faster queries
recommendationSchema.index({ user_id: 1, generated_at: -1 });
recommendationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic expiration

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
