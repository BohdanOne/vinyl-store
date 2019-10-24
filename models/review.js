const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: 'Please provide a rating (1-5)',
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Please provide an integer value in range 1 - 5'
    }
  },
  text: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);