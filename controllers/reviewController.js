const Review = require('./../models/reviewModel');
const Tour = require('./../models/tourModel');

const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  //if user not defined in id in the body we try to get from the params we defined a route for that
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.body.tour);
  const reviewed = await Review.find({ tour: tour.id, user: req.user.id });
  console.log('reviewed', reviewed);
  if (reviewed) {
    return next(
      new AppError('You have already written review for this tour', 500)
    );
  }
  const doc = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
