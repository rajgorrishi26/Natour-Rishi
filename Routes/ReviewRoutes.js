const express = require('express');
const reviewController = require('./../Controllers/reviewController');
const authController = require('./../Controllers/authController');


const router = express.Router({mergeParams:true});

router.use(authController.protect);

router.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'),
reviewController.setTourUserIds,
reviewController.createReviews
);

router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user','admin'),reviewController.updateReviews)
.delete(reviewController.deleteReview);

module.exports = router;