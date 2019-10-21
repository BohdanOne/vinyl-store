require('dotenv').config();
require('./data/db');

const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');

const User = require('./models/user');

const index = require('./routes/index');
const stores = require('./routes/stores');
const users = require('./routes/users');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));

app.use(require('express-session')({
  secret: process.env.PASSPORT,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
})

app.use(index);
app.use('/stores', stores);
app.use('/users', users);

app.use(morgan('tiny'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, process.env.IP, () => console.log(`Vinyl Store server listening at ${PORT}`));