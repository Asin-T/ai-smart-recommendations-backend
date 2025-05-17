const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    interaction_type: {
      type: String,
      enum: ['view', 'click', 'like', 'purchase', 'search'],
      required: [true, 'Interaction type is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for faster queries
interactionSchema.index({ user_id: 1, product_id: 1, interaction_type: 1 });
interactionSchema.index({ user_id: 1, timestamp: -1 });
interactionSchema.index({ product_id: 1, timestamp: -1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
