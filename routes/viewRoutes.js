const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

//we want /overview to be the route so only /
router.get(
  '/',
  bookingController.createBookingCheckOut,
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);
router.get(
  '/verify/:email',
  authController.isLoggedIn,
  viewsController.confirmEmail
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get(
  '/createReview/:slug',
  authController.protect,
  viewsController.createReview
);
router.get('/my-reviews', authController.protect, viewsController.myReviews);

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateUserData
// );
module.exports = router;
