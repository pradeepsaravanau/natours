const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  //send for encrypted connection only https
  //cannot be accessed or modified prevents cross site scripting atks
  httpOnly: true
};

const signToken = id => {
  //{ id: id } = {id}
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  //only remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const token = Math.floor(Math.random() * 8999) + 1000;
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    confirmEmailToken: token
  });
  console.log(req.get('host'));
  const url = `${req.protocol}://${req.get('host')}/verify/${newUser.email}`;
  await new Email(newUser, url).sendEmailConfirmation();
  // createSendToken(newUser, 201, res);
  res.status(200).json({
    status: 'success',
    message: 'please verify your email'
  });
});
exports.verifyToken = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const user = await User.findOne({ email: req.body.email });
  console.log('usre is', user);
  if (!user) {
    return next(new AppError('user not found signup and verify'));
  }
  if (!user.confirmEmailToken) {
    return next(new AppError('user already verified you can login'));
  }
  console.log(+req.body.confirmEmailToken, +user.confirmEmailToken);
  if (!(+req.body.confirmEmailToken === user.confirmEmailToken)) {
    return next(
      new AppError('you have entered a wrong token please try again')
    );
  }

  user.confirmEmailToken = undefined;
  user.confirmEmail = true;
  await user.save({ validateBeforeSave: false });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(user, url).sendWelcome();
  createSendToken(user, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('plear provide  email and password', 400));
  }
  //check user exists && password is correct
  //in user model we select : false for password to select explcitiyly tha password we  use like this
  const user = await User.findOne({ email: email }).select('+password');
  if (!user.confirmEmail) {
    return next(new AppError('check your mail and verify email', 401));
  }
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 400));
  }
  //3) if everthing ok , send token to client
  createSendToken(user, 200, res);
});
exports.logout = (req, res) => {
  //set the jwt to dummy text previously it was token but now its dummy text ,also set the expires in 10seconds
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //2) verification token
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }
  //verify function requires a call back verify is a async function after verfication it call the call back function we can specify
  // const verify = promisify(jwt.verify);
  // verify(token, process.env.JWT_SECRET).then().catch()
  //instead of doing like this we can do like prmosify
  // const decoded = await jwt.verify(
  //   token,
  //   process.env.JWT_SECRET,
  //   {}, // passing an empty options object to get to callback
  //   (err, value) => {
  //     if (err) {
  //       return next(new AppError('Error', 401));
  //     }
  //     return value;
  //   }
  // );
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does no longer exist.', 401)
    );
  }
  //4) check if user changed password after token was issued.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User Recently changed the password! please login again!',
        401
      )
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTES
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
//only for rendered pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
  //1) verifies token
  if (req.cookies.jwt) {
    try {
      //2) verification token

      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3)Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4) check if user changed password after token was issued.
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //there is a logged in user
      //use this inorder for the pug template to acess this route
      console.log(currentUser.confirmEmail);
      if (currentUser.confirmEmail) res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
exports.restrictTo = (...roles) => {
  //in the return function we can access by  closures
  return (req, res, next) => {
    //roles ['admin' , 'lead-guide'] . role = user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with email address', 404));
  }
  //2) generate the random reset token
  const resetToken = user.createPasswordResetToken();

  //while saving we need to pass the entire document
  //user.save expects all the required data to set to dissale we use validateBeforeSave
  await user.save({ validateBeforeSave: false });
  //3) send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({ status: 'success', message: 'Token send to email' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email !. please try again later.',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2) if token has not expired and there is user ,set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  //3) update changedPasswordAt property for the user
  createSendToken(user, 200, res);

  //login the user in , send jwt
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2) check if posted current password is correctPassword

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your password is wrong !', 401));
  }
  //why cant we use findById and update is because of 2 reasons
  //1st reason :
  // validate: {
  //   //we cannot use arrow
  //   //this only works on CREATE and SAVE!!
  //   validator: function(el) {
  //     return el === this.password;
  //   },
  //   message: 'Passwords are not the same'
  // } wont work because the this.password is not defined internally does not keep in memory.
  //pre save middleware will also not work for update
  //3) if so , update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log user in , send Jwt
  createSendToken(user, 200, res);
});
