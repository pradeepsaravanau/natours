//development environment and production environment
//everything not related to express we dont do in app.js
const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log(`uncaught exception ! 💥 shutting down`);
  console.log(err.name, err.message, err);

  // in unhandledRejection we don't need to crash the application which can be optional
  //but in uncaughtexception we really need to crash the application whenever uncaughtRejection occurs the entire node process is in unclean state to fix that we need  to terminate that and restart . in production we need to have a tool in place to restart the app.
  process.exit(1);
});
dotenv.config({ path: './config.env' });
//we need to run the dotenv first and then app will call
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//mongoose.connect returns a promise
mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    // console.log(con.connections);
    console.log('db connection successful!');
  });

const app = require('./app');

// console.log(app.get('env'));
//its shows the environment we are in .
//app.get('env') gets the env variable
//environment var  are global variables that are used to define the environment in whcih no app is running
// console.log(process.env);
//many variable appear it is coming coming from process core module it is required when process start we dont need to require

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

//So again many packages on npm that we use for Express development actually depend on thisenvironment variable.And so when our project is ready and we are gonna deploy it,we then should change the node env and variable to production.And we will do that of course once we deploy the project by the end of the course.So we set node env and X as environment variables,but we can do a lot more.

//And that's because we usually use environment variables like configuration settings for our applications.So whenever our app needs some configuration for stuff that might change based on the environment that the app is running in, we use environment variables.For example we might use different databases for developmentand for testing until we could define one variable for each and then activate the right database according to the environment.Also we could set sensitive data like passwords and user name using environment variables.

//central place for all unhandled errors
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);

  console.log(`unhandledRejection ! 💥 shutting down`);
  //1 for uncaught exception  , 0 for success
  //to close the server we store the app.listen in the variable
  server.close(() => {
    process.exit(1);
  });
});

//sigterm signal
//a heroky dyno is the name that heroku uses for a container which is the container , it will refresh the app 24hrs and to keep our in a healthy state
//with sigterm signal our application will shutdown immediately and users requesting at the time those requests will hang in the air
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED .shutting  down gracefully');
  //server.close waits until pending requests are finished
  server.close(() => {
    console.log('💥process terminated!');
  });
});
//cors - cross origin resource sharing
//natoursups/api/v1/tours is our api and another website called example.com tries to access our api then it is called cross origin resource sharing
