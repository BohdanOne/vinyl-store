const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  info: String,
  joined: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    required: true
  },
  imageId: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);