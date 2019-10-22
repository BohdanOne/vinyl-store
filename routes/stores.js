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
    const hours = {
      'monday': `${req.body.mondayOp} - ${req.body.mondayCl}`,
      'tuesday': `${req.body.tuesdayOp} - ${req.body.tuesdayCl}`,
      'wednesday': `${req.body.wednesdayOp} - ${req.body.wednesdayCl}`,
      'thursday': `${req.body.thursdayOp} - ${req.body.thursdayCl}`,
      'friday': `${req.bodyfridayOp} - ${req.bodyfridayCl}`,
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
    res.redirect(`/stores/${store._id}`);
  } catch(error) {
    console.log(error)
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
    console.log(error);
    res.redirect('back');
  }
});


// TODO
// edit route
// update route

// UPDATE CAMPGROUND ROUTE
// router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
//   delete req.body.campground.rating;         <====== wazne!
//   // find and update the correct campground
//   Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
//       if (err) {
//           res.redirect("/campgrounds");
//       } else {
//           //redirect somewhere(show page)
//           res.redirect("/campgrounds/" + req.params.id);
//       }
//   });
// });

router.delete('/:id', isLoggedIn, isStoreAuthor, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(store.imageId);
    await Review.deleteMany({ _id: {$in: store.reviews}});
    // usuwanie powiazanych ocen
    await store.remove();
    res.redirect('/stores');
  } catch(error) {
    console.log(error);
    res.redirect('back');
  }
});

module.exports = router;