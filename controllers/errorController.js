const AppError = require('./../utils/appError');
//if url starts with /api we want use json and if url start without /api we need to render error page
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = err => {
  // const x = err.errmsg.substring(
  //   err.errmsg.indexOf('"') + 1,
  //   err.errmsg.lastIndexOf('"')
  // );
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // const value = err.keyValue.name;
  const message = `Duplicate field value : ${value} . Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = err => {
  const error = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${error.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError('Invalid Token Please Login again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Your Token has Expired!  Please Login again!', 401);
const sendErrorDev = (err, req, res) => {
  //original url is the entire url not with the host
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //b) RENDER WEBSITE
  console.error(`ERROR 💥 `, err);
  console.error(`ERROR 💥 `, err.stack);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};
const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    //A) Operational , trusted error : send message to the client
    if (err.isOperational) {
      //OPERATIONAL , TRUSTED ERROR : SEND MESSAGE TO CLIENT
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //b) PROGRAMMING OR OTHER UNKNOWN ERROR : DONT WANT TO LEAK THE ERROR FOR USERS

    //1)LOG ERROR
    console.error(`ERROR 💥 `, err);
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong!'
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later'
  });
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err }; //not work in morden mongoose err.name is not found in object first level its in the prototype so this from jonas doesnt work
    // console.log(err.name);s
    let error = Object.create(err);
    // let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
