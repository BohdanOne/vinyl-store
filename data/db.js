const mongoose = require('mongoose');

const db_URI = process.env.DB_URI;
mongoose.connect(`${db_URI}`, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true
});
mongoose.connection.on('connected', () => console.log(`Mongoose connected`));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));
mongoose.connection.on('error', error => console.error(`Mongoose connection error: ${error}`));