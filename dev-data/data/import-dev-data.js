//development environment and production environment
//everything not related to express we dont do in app.js
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');
const Booking = require('./../../models/bookingModel');

dotenv.config({ path: './config.env' });
//we need to run the dotenv first and then app will call
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//mongoose.connect returns a promise
mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    // console.log(con.connections);
    console.log('db connection successful!');
  });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/toursCustom.json`, 'utf-8')
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//import data in db
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, {
      validateBeforeSave: false
    });
    await Review.create(reviews);
    console.log('data sucessfully loaded');
  } catch (err) {
    console.log(err);
  }
  //agressive way of stopping
  process.exit();
};
//delete all the data from collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    await Booking.deleteMany();
    console.log('data sucessfully deleted');
  } catch (err) {
    console.log(err);
  }
  //agressive way of stopping
  process.exit();
};
const updateDate = async () => {
  try {
    await User.updateMany({}, { confirmEmail: true }, { runValidators: false });
    console.log('data sucessfully updated');
  } catch (err) {
    console.log(err);
  }
  //agressive way of stopping
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else if (process.argv[2] === '--update') {
  updateDate();
}
console.log(process.argv);
