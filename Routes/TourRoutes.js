  const express = require('express');
  const tourController = require('./../Controllers/TourController.js');
  const authController = require('./../Controllers/authController.js');
  const reviewRouter = require('./../Routes/ReviewRoutes.js')

  const router = express.Router();

  // router.param('id',tourController.CheckID);

  // router.route('/:tourId/reviews')
  // .post(authController.protect ,authController.restrictTo('user'),reviewController.createReviews);

  router.use('/:tourId/reviews',reviewRouter); 


  router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.GetAllTours);

  router
  .route('/tour-stats')
  .get(tourController.getTourStats);

  router
  .route('/tour-monthly-plan/:year')
  .get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),
    tourController.getMonthlyplan);

    router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

    router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

  router
    .route('/')
    .get(authController.protect, tourController.GetAllTours)
    .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.CreateTour);

    router
    .route('/:id')
    .get(tourController.GetTour)
    .patch(
      authController.protect,
      authController.restrictTo('admin', 'lead-guide'),
      tourController.uploadTourImages,
      tourController.resizeTourImages,
      tourController.UpdateTour
    )
    .delete(
      authController.protect,
      authController.restrictTo('admin', 'lead-guide'),
      tourController.deleteTour
    );


  module.exports = router;