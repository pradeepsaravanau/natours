const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

//adding method to bunch of app variable
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

//set the the template engine to pug
//express supports most common enginees out of the box , we  need to install and no need require
app.set('view engine', 'pug');
//now also define also these views are located in our file system
//our pug templates are called views in express and because our templates are views in the model view controller architecture
//we cant use like './use' the path that we provide here always relative to the directory from where we launched the node application and usually the root project folder but it might not be and so we should'nt use .
//in order to work we can use path module
//path is a core module
app.set('views', path.join(__dirname, 'views'));
//this will basically create a path joining directory name /views , but we dont always no the path we are receiving from somewhere already has / or not so you will see this function will all the inorder to this kind of bug
//serving stating files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
//Set security HTTP headers
//call the helmet that will then the produce the middleware that should be put right in b/w app.use() . in app.use we always need a function not a function call
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:']
    }
  })
);
//middleware : is a function that can modify incoming req data , coz its stands bw req and res its just a step that the request goes thro while its being processed . the step here is gone through is the data that from the body is added to it.
//1) MIDDLEWARES
//we can access process.env coz we use it in server.js since its a single process so we can access
//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//global middleware
//limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this ip please try again in an hour!'
});
//added for all routes starts with /api
app.use('/api', limiter);

//calling this morgan function will return function similar to app.use((req, res, next) => {} this coz this how middleware function looks like

//body parser , reading data from the body into req.body
//limit the amount of data coming from body
//when we have have body larger than 10kb it wont accept it
app.use(express.json({ limit: '10kb' }));
//the way the form sends the data is called urlencoded becuase in user update data  we specified the method and the url in the html pug template itselfs so we use expresss.urlencoded
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//we serve static files in express like this so only we can use overview.html
//Data sanitazation against nosql query inject

//will look at the req.body and req.params and filter out dollar sign and dots and removing that these operation wont work
app.use(mongoSanitize());

//Data sanizationa against xss => cross site scripting attacks
//what if attacker tries to insert html code with js code
//attackers need to have crazy data into our database
//our mongoose model is quite usefull that attacker cant inseert crazy data
app.use(xss());

//we dont need to use /public/overview coz we indicated the express to set it to the root the express will look for the file  overview.html in public folder
// http://127.0.0.1:3000/overview.html this url will work only use use the static middleware like this for tha dirnames path
//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
//prevent paramater pollution
// app.use(hpp());  we can simple use like this for {{URL}}api/v1/tours?sort=duration,sort=price it chooses the price alone , but we use {{URL}}api/v1/tours?duration=5&duration=9 it only shows the duration =9 not 5 but previously it works but now it wont show we like this
//whitelist where we allow duplicates
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);
//define routes
//how our app responds based on clients req
//ROUTE HANDLERS

// (req , res) => {} route handler
//json.parse converts json to array of objects
//dirname starts from root upto my knowledefe
//route here is route /
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
//handling errors
//handling unhandled routes
//middleware executes in order so if we no route catched above it comes here where we can handle error
//above routes cant catch
//all http methods like GET, POST , patch delete
//operational error
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // for express to understand that the error middleware we should pass the err as argument
  //whenever we pass the middeware with errors it assumes that and error is occured and  all other middleware is skiped.
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
//error handling middleware
app.use(globalErrorHandler);
//4) START SERVER
module.exports = app;
//afterrefactered: we start receiveing request from app.js , it will then depending on the router enter on of the router so lets say tourRoutes and then depending again on that router and of the request it will done execute on of the controllers , these are in the tourcontroller file and thats where the response gets send and it completes the request and response cycle.
