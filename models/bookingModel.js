const mongoose = require('mongoose');
const Tour = require('./tourModel');
const AppError = require('./../utils/appError');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  price: {
    type: Number,
    required: [true, 'Booking  must hava a price']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  },
  date: {
    type: mongoose.Schema.ObjectId,
    require: [true, 'A tour must have a booking date']
  }
});
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});
bookingSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true
  }
);
bookingSchema.pre('save', async function(next) {
  const tour = await Tour.findById(this.tour);
  if (!tour) return next();
  // const startDate = tour.startDates.id(this.date);
  // console.log(startDate);
  // if (startDate.soldOut) {
  //   return next(new AppError('Booking for that tour is sold out', 404));
  // }
  startDate.participants += 1;
  if (tour.maxGroupSize <= startDate.participants) {
    startDate.soldOut = true;
  }

  await tour.save();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
