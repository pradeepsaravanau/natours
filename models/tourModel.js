//so mongoose is all about modals a modal is a blueprint we used to create documents , like classes in js
//we create a modal in mongoose in order to create docs using it , perform crud
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true, //unique is not validator technically it will still produce error without unique
      trim: true,
      maxlength: [40, 'A tour must have less or equal 40 charecters'],
      minlength: [10, 'A tour must have more or equal 10 charecters']
      // validate: [validator.isAlpha, 'Tour Name Must Only Contain characters']
    }, //schema type options
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //enum only for string
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Diffcult is either : easy , medium , difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //math.round => 4.666 => 5
      //math.round*10 => 4.666 => 46
      // math.round*10 / 10 => 4.666 => 46/10 => 4.6
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this only points to current document on new document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
      //removes whitespace in begining and end of the string
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must a have a cover image']
    },
    //array of strings
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [
      {
        date: {
          type: Date,
          required: [true, 'A tour must have a start date']
        },

        participants: {
          type: Number,
          default: 0
        },
        soldOut: {
          type: Boolean,
          default: false
        }
      }
    ],

    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      //array of numbers , longitude first
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //here in the guide now we want to specify an array JUST LIKE WE DID FOR LOCATIONS this will be subdocuments
    //the type will be mongoose.Schema.ObjectId which is that it expects mongo object id and we use object
    //refernce
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  }, //schema definition
  {
    //schema options for when data is json also for object , virtuals to true which includes tours
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
//1 sort in acending order //-1 means descending
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//2d sphere index
//startLocation is indexed to a earth like sphere
tourSchema.index({ startLocation: '2dsphere' });
//we define virtual properties on the tour schema passing the name of the virtual property = durationweeks ,on there we define get method , and thats just because this virtual property will be created each time we get the data out of  the database
//in arrow function we cannot use this key word , here the this points the current document.
//we cannot use the virtaul property on a query we cannot use like tour.find() where durationWeek = 1
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  //foreignfield is the name of the field in the other field
  foreignField: 'tour',
  //where that id is stored in the current field
  localField: '_id'
});
//document middleware can be used on current document.
//pre will run before the event we specify(here .save and .create) it will not work from insertMany
tourSchema.pre('save', function(next) {
  //here this keyword is the current document.
  //we will get the document before saving 💥
  // console.log(this);
  //called pre save hook
  this.slug = slugify(this.name, {
    lower: true
  });

  next();
});
// tourSchema.pre('save', async function(next) {
//   //it executes one by one so storing all the promies in guidesPromises and use promise.all(guidesPromises) in the next step
//   const guidesPromises = this.guides.map(id => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
/*
tourSchema.pre('save', function(next) {
  console.log('will save document');
  next();
});
tourSchema.post('save', function(doc, next) {
  //here we dont have this keyword instead we have doc keyword
  console.log(doc);
  //for one post middleware we didint need next , but we can specify
  next();
});
*/
//QUERY MIDDLEWARE
//here the this keyword will point to the query
//secret Tours
//^find is used to esecute all the string starts with find
tourSchema.pre(/^find/, function(next) {
  //query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  next();
});
// tourSchema.pre('findOne', function(next) {
//   //query
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
tourSchema.pre(/^find/, function(next) {
  //this is the query ....
  //all the query now is populated to guides field
  this.populate({
    path: 'guides',
    //- unselect
    select: '-__v -passwordChangedAt'
  });
  next();
});
// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`query took ${Date.now() - this.start} milliseconds`);

//   next();
// });
//AGGREATION middleware
// tourSchema.pre('aggregate', function(next) {
//   //we need to filter out the secretTour out we need to add match
//   //add at the first  off the array we use unshift
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //this.pipeline() is the object that we want from the this keyword
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
//this will be a new document created out of the tour modal
//test tour is an instance of the tour modal above
// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 997~
//   });
//   //inorder to save the document to then db
//   testTour
//     .save()
//     .then(doc => {
//       console.log(doc);
//     })
//     .catch(err => {
//       console.log('ERROR 💥:', err);
//     });
