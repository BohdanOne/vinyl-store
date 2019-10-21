const express = require('express');
const cloudinary = require('cloudinary');
const geocoder = require('../helpers/geocoder');
const upload = require('../middlewares/multer');
const isLoggedIn = require('../middlewares/isLoggedIn');

const Store = require('../models/store');

const router = express.Router();

const escapeRegex = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

cloudinary.config({
  cloud_name: 'bohdan',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get('/', async (req, res) => {
  if(req.query.search) {
    try {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      const stores = await Store.find({ name: regex });
      if(stores.length > 0) {
        res.render('stores/index', { stores });
      } else {
        console.log('No match'); // TODO: flash message
        res.redirect('/stores');
      }
    } catch(error) {
      console.log(error);
    }
  } else {
    try {
      const stores = await Store.find();
      res.render('stores/index', { stores });
    } catch(error) {
      console.log(error);
    }
  }
});

router.get('/new', isLoggedIn, (req, res) => res.render('stores/new'));

router.post('/', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const {name, description } = req.body;
    const author = {
      id: req.user._id,
      username: req.user.username
    };
    const imgPath = await cloudinary.uploader.upload(req.file.path);
    const image = imgPath.secure_url;
    const imageId = imgPath.public_id;
    const data = await geocoder.geocode(req.body.location);
    const lat = data[0].latitude;
    const lng = data[0].longitude;
    const location = data[0].formattedAddress;

    const store = await Store.create({ name, image, imageId, description, location, lat, lng, author });
    res.redirect(`/stores/${store._id}`);
    res.redirect(`/stores/`);
  } catch(error) {
    // req.flash('error', error.message);
    console.log(error)
    res.redirect('back');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    const apiKey = process.env.GEOCODER_API_KEY;
    res.render('stores/show', { store, apiKey });
  } catch(error) {
    console.log(error);
    res.redirect('back');
  }
});


// TODO
// edit route
// update route

router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    // await cloudinary.v2.uploader.destroy(store.imageId);
    await store.remove();
    res.redirect('/stores');
  } catch(error) {
    console.log(error);
    res.redirect('back');
  }
});




module.exports = router;