require('dotenv').config();
require('./data/db');

const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');

const index = require('./routes/index');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));

app.use(index);

app.use(morgan('tiny'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, process.env.IP, () => console.log(`Vinyl Store server listening at ${PORT}`));