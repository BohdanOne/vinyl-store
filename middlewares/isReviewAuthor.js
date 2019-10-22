const Review = require('../models/review');

module.exports = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.review_id);
    if (!review) {
      res.redirect('back');
    } else {
      if(review.author.id.equals(req.user._id)) {
        next();
      } else {
        console.log('You can edit only your own reviews!');
        res.redirect('back');
      }
    }
  } catch(error) {
    console.log(eror);
    res.redirect('back');
  }
}