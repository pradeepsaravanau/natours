const express = require('express');

//mergeParams merge the params used for the thing app.use() code in tourRoutes.js

//by default each router has access to parameter of the specific routes but here in this route in post there is no tour id but we still need to get acess from the other tourroutes.js router and so we bascially need to merge parameter
//no matter if we get like post /tour/23ed/reviews  or /reviews it does excecute the same router.route code below

//all of the route that we defined in tour/23ed/reviews will be redirected to this route exactly to this line
const router = express.Router({ mergeParams: true });
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// router.route('/createReview').post(reviewController.createReview);
// router.route('/getAllReviews').get(reviewController.getAllReviews);
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );
module.exports = router;
