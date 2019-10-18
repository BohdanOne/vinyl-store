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
  info: String,
  password: String,
  image: {
    type: String,
    default: 'https://res.cloudinary.com/bohdan/image/upload/v1571399330/default-avatar_xxgpvl.png'
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