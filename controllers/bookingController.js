//require('stripe') = exposes a function pass in the stripe secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  const startDate = tour.startDates.id(req.params.dateId);
  //create checkout session
  if (!startDate) return next();

  if (startDate.soldOut) {
    return res.status(200).json({
      status: 'error',
      message:
        'Booking for this date is already soldout Please Choose another Date'
    });
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}&date=${req.params.dateId}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    //allows us to pass info about sessions we are working
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        //one of the reason why stripe works only while hosted because down the images specified here will be looked by the stripe server , so it should be hosted it doenst know d:natours/public/img/tour-1.jpg
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        //cents
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  //send to client
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckOut = catchAsync(async (req, res, next) => {
  //this is only Temproray , because its unsecure , everyone can make booking without paying
  const { tour, user, price, date } = req.query;
  if (!tour && !user && !price && !date) return next();
  await Booking.create({ tour, user, price, date });
  // // req.originalUrl = ${req.protocol}://${req.get('host')}/?tour=${
  //     req.params.tourId
  //   }&user=${req.user.id}&price=${tour.price}`
  res.redirect(req.originalUrl.split('?')[0]);
});
exports.getTourIdOrGetUserId = (req, res, next) => {
  if (req.params.tourId) req.params.tourId = req.params.tourId;
  if (req.params.userId) req.params.userId = req.params.userId;
  next();
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
