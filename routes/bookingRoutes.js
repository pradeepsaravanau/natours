const express = require('express');
const bookingController = require('./../controllers/bookingController');

const authController = require('./../controllers/authController');

const router = express.Router();
router.use(authController.protect);
router.get(
  '/checkout-session/:tourId/:dateId',
  bookingController.getCheckoutSession
);

router.get(
  '/tour/:tourId/bookings',
  bookingController.getTourIdOrGetUserId,
  bookingController.getAllBookings
);
router.get(
  '/user/:userId/bookings',
  bookingController.getTourIdOrGetUserId,
  bookingController.getAllBookings
);
router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;
