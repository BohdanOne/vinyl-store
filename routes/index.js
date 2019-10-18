const express = require('express');

const landingController = require('../controllers/landing');

const router = express.Router();

router
  .route('/')
  .get(landingController.getLanding);

module.exports = router;