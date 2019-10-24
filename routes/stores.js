const express = require('express');
const cloudinary = require('cloudinary');
const geocoder = require('../helpers/geocoder');
const upload = require('../middlewares/multer');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isStoreAuthor = require('../middlewares/isStoreAuthor');

const Store = require('../models/store');
const Review = require('../models/review');

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
        req.flash('success', `We have found ${stores.length} ${stores.length === 1 ? 'store' : 'stores'} matching your search..`);
        res.render('stores/index', { stores });
      } else {
        req.flash('error', 'We cannot find store matching your search..')
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
    const hours = {
      'monday': `${req.body.mondayOp} - ${req.body.mondayCl}`,
      'tuesday': `${req.body.tuesdayOp} - ${req.body.tuesdayCl}`,
      'wednesday': `${req.body.wednesdayOp} - ${req.body.wednesdayCl}`,
      'thursday': `${req.body.thursdayOp} - ${req.body.thursdayCl}`,
      'friday': `${req.body.fridayOp} - ${req.body.fridayCl}`,
      'saturday': `${req.body.saturdayOp} - ${req.body.saturdayCl}`,
      'sunday': `${req.body.sundayOp} - ${req.body.sundayCl}`
    };
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

    const store = await Store.create({ name, image, imageId, description, location, lat, lng, author, hours });
    req.flash('success', 'Congratulation. Yue have created a new store!')
    res.redirect(`/stores/${store._id}`);
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate({
      path: 'reviews',
      options: { sort: {createdAt: -1}}
    }).exec();
    const apiKey = process.env.GEOCODER_API_KEY;
    res.render('stores/show', { store, apiKey });
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.get('/:id/edit', isLoggedIn, isStoreAuthor, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    res.render('stores/edit', { store });
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.put('/:id', isLoggedIn, isStoreAuthor, upload.single('image'), async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    const data = await geocoder.geocode(req.body.location);
    delete req.body.rating;
    store.name = req.body.name;
    store.description = req.body.description;
    store.lat = data[0].latitude;
    store.lng = data[0].longitude;
    store.location = data[0].formattedAddress;
    store.hours = {
      'monday': `${req.body.mondayOp} - ${req.body.mondayCl}`,
      'tuesday': `${req.body.tuesdayOp} - ${req.body.tuesdayCl}`,
      'wednesday': `${req.body.wednesdayOp} - ${req.body.wednesdayCl}`,
      'thursday': `${req.body.thursdayOp} - ${req.body.thursdayCl}`,
      'friday': `${req.body.fridayOp} - ${req.body.fridayCl}`,
      'saturday': `${req.body.saturdayOp} - ${req.body.saturdayCl}`,
      'sunday': `${req.body.sundayOp} - ${req.body.sundayCl}`
    };
    if(req.file) {
      try {
        await cloudinary.v2.uploader.destroy(store.imageId);
        const imgPath = await cloudinary.uploader.upload(req.file.path);
        store.image = imgPath.secure_url;
        store.imageId = imgPath.public_id;
      } catch(error) {
        req.flash('error', error.message);
        res.redirect('back');
      }
    }
    await store.save();
    req.flash('success', 'Store updated.');
    res.redirect(`/stores/${req.params.id}`);
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.delete('/:id', isLoggedIn, isStoreAuthor, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(store.imageId);
    await Review.deleteMany({ _id: {$in: store.reviews}});
    await store.remove();
    req.flash('success', 'Store successfully removed.')
    res.redirect('/stores');
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

module.exports = router;