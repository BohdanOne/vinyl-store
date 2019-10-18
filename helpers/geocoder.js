const NodeGeocoder = require('node-geocoder');

module.exports = NodeGeocoder({
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
});

