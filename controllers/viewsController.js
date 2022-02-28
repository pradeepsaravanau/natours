const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const Review = require('./../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) get tour data from collection
  const tours = await Tour.find();
  //2) build template

  //3) render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    // tours: tours
    tours
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  //1) get the data , for the requested tour include reviews and tourguides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  if (res.locals.user) {
    const bookings = await Booking.find({ user: res.locals.user.id });
    const tourIDs = bookings.map(el => el.tour);
    const userBookedTour = await Tour.find({ _id: { $in: tourIDs } });
    // console.log(userBookedTour);

    if (userBookedTour) {
      userBookedTour.forEach(t => {
        if (t.id === tour.id) {
          res.locals.alreadyBooked = true;
        }
      });
    }
  }
  console.log(req.alreadyBooked);
  //2) build the template
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"
    )
    .render('tour', {
      title: tour.name,
      tour
    });
});
exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
      title: 'Log into your account'
    });
};
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};
exports.getMyTours = catchAsync(async (req, res, next) => {
  //Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //find tours with returned ids
  const tourIDs = bookings.map(el => el.tour);
  //in among the array of tourids it finds all of the matching tours and return to tours
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  console.log(tours);

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
exports.updateUserData = catchAsync(async (req, res, next) => {
  console.log(req.body.name, req.body.email);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  //we need to pass in updatedUser otherwise it will use the user from protect route
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});

exports.getSignupForm = (req, res) => {
  res.render('signup');
};
exports.createReview = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug });
  // const review

  res.render('review', {
    title: 'Review',
    tour
  });
});

exports.myReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id }).populate('tour');
  console.log(reviews);
  // cons;
  res.render('myReviews', {
    title: 'My Reviews',
    reviews
  });
});
exports.confirmEmail = catchAsync(async (req, res, next) => {
  const { email } = await User.findOne({ email: req.params.email });
  res.render('verifyEmail', {
    title: 'Email verification',
    email
  });
});
