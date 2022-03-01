//require('stripe') = exposes a function pass in the stripe secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}&date=${req.params.dateId}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    //allows us to pass info about sessions we are working
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        //one of the reason why stripe works only while hosted because down the images specified here will be looked by the stripe server , so it should be hosted it doenst know d:natours/public/img/tour-1.jpg
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
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

exports.getTourIdOrGetUserId = (req, res, next) => {
  if (req.params.tourId) req.params.tourId = req.params.tourId;
  if (req.params.userId) req.params.userId = req.params.userId;
  next();
};
const createBookingCheckOut = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`webhook error ${err.message}`);
  }
  if (event.type === 'checkout.session.completed')
    createBookingCheckOut(event.data.object);

  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
