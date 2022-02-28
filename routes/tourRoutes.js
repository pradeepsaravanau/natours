const express = require('express');
const tourController = require('./../controllers/tourController.js');
const authController = require('./../controllers/authController.js');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//nested route
//post /tour/idlike190931/reviews
//in the same way we will want to access review from a certain tour in a same way
//get /tour/idlike190931/reviews
//get /tour/idlike190931/reviews/idofreview

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
//mounting a route // just like in app.js

router.use('/:tourId/reviews', reviewRouter);
//param middleware runs for certain paramater that is basically the parameter we have in the url (:/id) here the value is the value of the parameter id that we pass in the url
// router.param('id', tourController.checkID);

//each router is kind of a miny sub application one for each resource .
//since the middleware is only specified in the router well then offcurse then only part of the middleware stack if we are actualy in the sub application
//lets suppose we have a incoming request tours/id that request then gothrough all the middle ware one by one like (app.use(express.json) , app.use(req, res , next)=> {}) and finnaly app.use('/api/v1/tours) that matches this the exact route it will then get to the tour router middle then goes to the above middleware it is working only it has id

//whenever we wanted to define a middleware we only passed only one middleware function . for eexample here the post request well then we only passed the middleware function which is createTour handler
//also we can
//create a checkBody middleware
//check if the body contains the name and price property
//if not,send back 400 (bad request)
//add it to the post handler stack
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

//or like this
//tours-distance?distance=233&center=40,-45&unit=miles
//this is ours
//tours-distance/233/center/-40,45/unit/miles

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
