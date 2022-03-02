//require('stripe') = exposes a function pass in the stripe secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

let globalDate;
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  const date = await tour.startDates.id(req.params.dateId);
  globalDate = date._id;
  //create checkout session
  if (!date) return next();
  if (date.soldOut) {
    return res.status(200).json({
      status: 'error',
      message:
        'Booking for this date is already soldout Please Choose another Date'
    });
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?date=${
      date._id
    }`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`
            ]
          }
        }
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
  const date = globalDate;
  console.log(date);
  console.log(session.line_items[0].price_data);
  const user = (await User.findOne({ email: session.customer_email })).id;

  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price, date });
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
  res.redirect(req.originalUrl.split('?')[0]);
  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
