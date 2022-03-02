const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//we could also store memory in buffer but for now we want to store as it is in file system
// const multerStorage = multer.diskStorage({
//   //destination is a callback function . inside it has req , file and cb is the callback function
//   destination: (req, file, cb) => {
//     //null for no error
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //user-userid-timestamp.jpg
//     //mimetype is image/jpeg like that
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   }
// });
//image is stored as an buffer
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

exports.userUploadPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getMe = (req, res, next) => {
  //we need to pass the req.user.id to the params.id because our factory function handles
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not for password updates please use /updateMyPassword',
        400
      )
    );
  }
  //req.body we use like this in updateTour but if we do like this we allow our to set like
  //user.role = 'admin' which should not
  //2) filtered out unwanted field name
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  //2) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  // const user = await User.findById(req.user.id);
  // user.name = req.body.name;
  // user.email = req.body.email;
  //cant use like this since it uses the validators , we have findByidANDUPDATE
  // await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not  defined please use /signup instead'
  });
};
//do not update password with this!
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
