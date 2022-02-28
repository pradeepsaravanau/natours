const mongoose = require('mongoose');
//review / rating / createdAt / ref to the tour / ref to user
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    //when we have a virtual property so basically a fields that is not stored in db calculated based on other values so we want this to also so whenever there is a output // it used now as virtual populate we use
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
//preventing duplicate reviewSchema
//1 user can write only one review on tour
reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true
  }
);
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});
//static methods
//in static method this points to the Model
//in instance method this points to document
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5
    });
  }
};
//pre is not because it is executed before saving the review
reviewSchema.post('save', function() {
  //this points to current review
  //this is the document
  //this.constructor is the model
  this.constructor.calcAverageRatings(this.tour);
});
//findByIdAndUpdate
//findByIdAAndDelete
//behind the scenes find by id and update or findoneandupdate
//in post we cannot use query middleware
reviewSchema.pre(/^findOneAnd/, async function(next) {
  console.log('query is', this);
  //this is the query and we use findOne to get the tour
  //current document
  //this.r because we can use in next middleware
  this.r = await this.findOne();
  console.log('r is', this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  // this.r = await this.findOne(); does not work because we cannot use like this here because query is already executed
  // this.r.constructor is the model
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
