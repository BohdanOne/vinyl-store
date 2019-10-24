const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if(user._id.equals(req.user._id) || req.user.isAdmin) {
      next();
    } else {
      console.log('Only author can do that')
      res.redirect(`/`);
    }
  } catch(error) {
    console.log(error)
    res.redirect('/');
  }
}