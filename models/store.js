const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: String,
  image: String, //default image
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
  }
  // comments: [
  //   {
  //    type: mongoose.Schema.Types.ObjectId,
  //    ref: 'Comment'
  //   }
  // ],
  // likes: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }
  // ]
});

module.exports = mongoose.model('Store', storeSchema);