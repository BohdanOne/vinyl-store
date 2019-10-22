const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: String,
  image: String,
  imageId: String,
  description: String,
  location: String,
  lat: Number,
  lng: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  rating: {
    type: Number,
    default: 0
  },
  hours: {}
});

module.exports = mongoose.model('Store', storeSchema);