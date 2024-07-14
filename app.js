const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require("./Utils/appError.js");
const globalErrorHandler = require('./Controllers/errorController.js');
const TourRouter = require('./Routes/TourRoutes.js');
const UserRouter = require('./Routes/UserRoutes.js');
const ReviewRouter = require('./Routes/ReviewRoutes.js');
const bookingRouter = require('./Routes/BookingRoutes.js');
const viewRouter = require('./Routes/viewRoutes.js');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// SERVING STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// SECURITY HTTP HEADERS 
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://js.stripe.com'],
      // Add other sources as needed
    },
  })
);
// DEVELOPMENT LOGGING
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// LIMIT REQUESTS FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// BODY PARSER, READING DATA FROM BODY INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended:true, limit: '10kb' }))
app.use(cookieParser());

// DATA SANITIZATION AGAINST NOSQL INJECTION 
app.use(mongoSanitize());

// DATA SANITIZATION AGAINST XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

app.use(compression())

app.use('/', viewRouter);
app.use('/api/v1/tours', TourRouter);
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/reviews', ReviewRouter);
app.use('/api/v1/bookings',bookingRouter); 

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
