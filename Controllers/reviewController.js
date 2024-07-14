// const catchAsync = require('../Utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handllerFactory');

exports.setTourUserIds = (req,res,next)=>{
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
}
exports.getReview = factory.getOne(Review);

exports.getAllReviews = factory.getAll(Review);

exports.createReviews = factory.createOne(Review);

exports.updateReviews = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
