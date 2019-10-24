const express = require('express');
const Store = require('../models/store');
const Review = require('../models/review');
const calculateAverage = require('../helpers/calculateAverage');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isReviewAuthor = require('../middlewares/isReviewAuthor');
const checkReviewExistence = require('../middlewares/checkReviewExistence');

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate({
      path: 'reviews',
      options: {
        sort: { createdAt: -1 }
      }
    }).exec();
    res.render('reviews/index', { store });
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back')
  }
});

router.get('/new', isLoggedIn, checkReviewExistence, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    res.render('reviews/new', { store });
  } catch(error) {
    req.flash('error', error.message);;
    res.redirect('back');
  }
});

router.post('/', isLoggedIn, checkReviewExistence, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('reviews').exec();
    const { rating, text } = req.body;
    const author = {
      id: req.user._id,
      username: req.user.username
    }
    const review = await Review.create({ rating, text, author, store});
    await review.save();
    store.reviews.push(review);
    store.rating = calculateAverage(store.reviews);
    await store.save();
    req.flash('success', 'Review saved!')
    res.redirect(`/stores/${store._id}`);
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.get('/:review_id/edit', isLoggedIn, isReviewAuthor, async (req, res) => {
  try {
    const review = await Review.findById(req.params.review_id);
    res.render('reviews/edit', { store_id: req.params.id, review });
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.put('/:review_id', isLoggedIn, isReviewAuthor, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.review_id, {
      rating: req.body.rating,
      text: req.body.text
    }, { new: true });
    const store = await Store.findById(req.params.id).populate('reviews').exec();
    store.rating = calculateAverage(store.reviews);
    await store.save();
    req.flash('success', 'Review updated!');
    res.redirect(`/stores/${store._id}`);
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

router.delete('/:review_id', isLoggedIn, isReviewAuthor, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.review_id);
    const store = await Store.findByIdAndUpdate(req.params.id, {$pull: { review: req.params.review_id }}).populate('reviews').exec();
    store.rating = calculateAverage(store.reviews);
    await store.save();
    req.flash('success', 'Review removed!');
    res.redirect(`/stores/${store._id}`);
  } catch(error) {
    req.flash('error', error.message);
    res.redirect('back');
  }
});

module.exports = router;
