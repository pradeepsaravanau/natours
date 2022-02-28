const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name , price , ratingsAverage , summary , difficulty';
  next();
};
const multerStorage = multer.memoryStorage();
//checks if file is image and return true if it s an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only images.', 400), false);
  }
};
//configure multier upload
//without desc then the uploaded img will be stored in memory and not saved anywhere to the disc
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
//upload.single('photo') = for single image //req.file
//incase if we only have one property like image we can use like
// upload.array('images', 3); //req.files
exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1) cover images
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2) Images
  req.body.images = [];
  //here the async await is inside foreach loop so next(); will be called right away so our req.body.images array will be empty
  //so use promise.all and change foreach to map
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  console.log(req.body.images);
  next();
});
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //204 no content

//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('no tour found with that ID', 404));
//   }
//   res.status(204).json({ status: 'success', data: null });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  //aggregation pipeline is provided my mongodb feature , mongoose is used to acesss
  //aggregate : aggregation pipeline is like regular query , difference is in aggregation we can manipulate the data in different steps for that we pass in array of so called stages , the documents then pass through these stages one by one in sequence like we define
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      //it allows us to group the documents based on accumalator , an acc is for ex  we can calc avg , if we have 5 tours we have 5 ratings we can have 5 ratings we can have
      //we specify id this is where specify what we want to group by for now we say null bcoz we have everything in one group so we can calculate these stat for all tours together , we can also group by difficulty
      //here sum = 1 coz it adds 1 for each element in group
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);
  res.status(200).json({ status: 'success', data: { stats } });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      // unwind will deconstruct an array field from the input doc and output one document to each element of the array and that what iam saying before which is that we want to have one tour for each of the stage in the document
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStats: { $sum: 1 },
        // pushing tour names in an array
        tours: { $push: '$name' }
      }
    },
    {
      //addingFields for each group month = id
      $addFields: { month: '$_id' }
    },
    {
      //if val = 0 it wont display,
      $project: {
        _id: 0
      }
    },
    {
      //1 = ASC , -1 DES
      $sort: { numTourStats: -1 }
    },
    {
      //only 12
      $limit: 12
    }
  ]);
  res
    .status(200)
    .json({ status: 'success', results: plan.length, data: { plan } });
});

//   '/tours-within:distance/center/:latlng/unit/:unit',
//or like this
//tours-distance?distance=233&center=40,-45&unit=miles
//this is ours
//tours-within/233/center/-40,45/unit/miles
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //our centerSphere accepts radius as radeons so we divide distance by radius of earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  console.log(distance, lat, lng, unit);
  //user enter latitude and longitude it find the tour within the area with a certain distance he speicies
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //our centerSphere accepts radius as radeons so we divide distance by radius of earth
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  //geoNear always need to be the first stage in aggregation
  const distances = await Tour.aggregate([
    {
      //incase multiple location fields we need to use key
      //here we have one startLocation
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        //distanceField is the name of the field and all the distances is calcuated and stored
        distanceField: 'distance',
        //with only distanceField our output is in meter to convert to km we use ditancemulitplier and multiply by 0.001
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
