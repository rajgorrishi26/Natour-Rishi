const express = require('express');

const viewController = require('./../Controllers/viewsController');
const authController = require('./../Controllers/authController');
const bookingController = require('./../Controllers/bookingController');
const router = express.Router();



router.get('/', bookingController.createBookingCheckout,authController.isLoggedIn, viewController.getOverview);
  
  router.get('/overview',viewController.getOverview);
  
  router.get('/tour/:slug', authController.isLoggedIn,viewController.getTour);

  router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

  // new added
  router.get('/signup', viewController.getSignupForm);

  router.get('/me',authController.protect,viewController.getAccount);

  router.get('/my-tours', authController.protect, viewController.getMyTours);

  router.post('/submit-user-data',authController.protect,viewController.updateUserData)

module.exports = router;