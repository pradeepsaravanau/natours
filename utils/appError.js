//we need our app to inherit all the errors so we extend and inherit the error
class AppError extends Error {
  constructor(message, statusCode) {
    //call the parent constructor
    //here the message is the only param the build in param accepts
    //SUPER(message) does the work of this.message = message
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //for programming errors this.isOperational is not set
    this.isOperational = true;

    //passing the current object which is this and the appError class istelf and which is this.constructor
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
