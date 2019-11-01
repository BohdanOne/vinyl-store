const Store = require('../models/store');

module.exports = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('reviews').exec();
    if(!store) {
      console.log('Store not found!');
      res.redirect('back');
    } else {
      const foundUserReview = store.reviews.some(review => review.author.id.equals(req.user._id));
      if (foundUserReview) {
        console.log('You can wrote only one review!');
        res.redirect(`/stores/${store._id}`);
      } else {
        next();
      }
    }
  } catch(error) {
    console.log(error);
    res.redirect('back');
  }
}