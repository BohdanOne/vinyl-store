const express = require('express');
const passport = require('passport');

const landingController = require('../controllers/landing');

const router = express.Router();

router
  .route('/')
  .get(landingController.getLanding);

module.exports = router;