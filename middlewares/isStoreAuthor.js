const Store = require('../models/store');

module.exports = async (req, res, next) => {
  try {
    const store = await Store.findOne({ _id: req.params.id });
    if(store.author.id.equals(req.user._id) || req.user.isAdmin) {
      next();
    } else {
      console.log('Only author can do that')
      res.redirect(`/`);
    }
  } catch(error) {
    console.log(error)
    res.redirect('/stores');
  }
}