const express = require('express');
const passport = require('passport');
// const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('cloudinary');
const isLoggedIn = require('../middlewares/isLoggedIn');
const upload = require('../middlewares/multer');

const User = require('../models/user');
const Store = require('../models/store');

const router = express.Router();

router.get('/register', (req, res) => res.render('users/register'));

router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { username, firstName, lastName, email, info } = req.body;
    const imgPath = await cloudinary.uploader.upload(req.file.path);
    const image = imgPath.secure_url;
    const imageId = imgPath.public_id;
    const newUser = await new User({ username, firstName, lastName, email, info, image, imageId });
    const user = await User.register(newUser, req.body.password);
    passport.authenticate('local')(req, res, () => {
      console.log(`${user.username} registered`);
      res.redirect(`/users/${ user._id }`);
    });
  } catch(error) {
    console.log(error);
    res.redirect('/users/register');
  }
});

router.get('/login', (req, res) => res.render('users/login'));

router.post('/login', passport.authenticate('local', {
  successRedirect: '/stores',
  failureRedirect: '/users/login'
}));

router.get('/logout', (req, res) => {
  req.logout();
  // req.flash('success', 'Logged out');
  res.redirect('/stores');
});

router.get('/:id', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) {
      console.log('user does not exist');
      return res.redirect('/');
    }
    const stores = await Store.find().where('author.id').equals(user._id).exec();
    res.render('users/show', { user, stores });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});



module.exports = router;