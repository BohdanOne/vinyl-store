const express = require('express');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('cloudinary');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isUserAuthor = require('../middlewares/isUserAuthor');
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
      req.flash('success', `Welcome ${user.username}!`);
      res.redirect(`/users/${ user._id }`);
    });
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('/users/register');
  }
});

router.get('/login', (req, res) => res.render('users/login'));

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/users/login',
  failureFlash: true
}), (req,res) => {
  req.flash('success', `Hello ${req.user.username}!`);
  res.redirect('/stores');
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Logged out');
  res.redirect('/stores');
});

router.get('/forgot', (req, res) => res.render('users/forgot'));

router.post('/forgot', async (req, res, next) => {
  try {
    const token = crypto.randomBytes(20).toString('hex');
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('error', 'We do not have account with that email address');
      return res.redirect('/users/forgot');
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    const smtpTransport = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'bohdanonedev@gmail.com',
        pass: process.env.GMAIL_PW
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'bohdanonedev@gmail.com',
      subject: 'Vinyl Store Password Reset',
      text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
    };
    await smtpTransport.sendMail(mailOptions);
    req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
    res.redirect('/stores');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/users/forgot');
  }
});

router.get('/reset/:token', async (req, res) => {
  try {
    await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    res.render('users/reset', { token: req.params.token});
  } catch (error) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    res.redirect('/users/forgot');
  }
});

router.post('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      res.redirect('back');
    }
    if (req.body.password !== req.body.confirm) {
      req.flash('error', 'Passwords do not match');
      res.redirect('back');
    }
    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const smtpTransport = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'bohdanonedev@gmail.com',
        pass: process.env.GMAIL_PW
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'bohdanonedev@gmail.com',
      subject: 'Vinyl Store - Your Password Has Been Changed',
      text: 'Hello,\n\n' +
      'This is a confirmation that the password for your account ' + user.email + ' at Vinyl Store has just been changed.\n'
    };
    await smtpTransport.sendMail(mailOptions);
    await req.logIn(user, () => {
      req.flash('success', 'Success! Your password has been changed.');
      return res.redirect('/stores');
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/stores');
  }
});

router.get('/:id', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) {
      req.flash('error', 'User does not exist');
      res.redirect('/stores');
    }
    const stores = await Store.find().where('author.id').equals(user._id).exec();
    res.render('users/show', { user, stores });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/stores');
  }
});

router.get('/:id/edit', isLoggedIn, isUserAuthor, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('users/edit', { user });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.put('/:id', isLoggedIn, isUserAuthor, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { username, firstName, lastName, email, info } = req.body;
    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.info = info;
    if(req.file) {
      try {
        await cloudinary.v2.uploader.destroy(user.imageId);
        const imagePath = await cloudinary.v2.uploader.upload(req.file.path);
        user.imageId = imagePath.public_id;
        user.image = imagePath.secure_url;
      } catch(err) {
        req.flash('error', error.message);
        res.redirect('back');
      }
    }
    await user.save();
    req.flash('success', 'Your profile has been updated.')
    res.redirect(`/users/${req.params.id}`);
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.delete('/:id', isLoggedIn, isUserAuthor, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(user.imageId);
    await user.remove();
    req.flash('success', 'Goodbye! Your profile has been removed.')
    res.redirect('/stores');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

module.exports = router;