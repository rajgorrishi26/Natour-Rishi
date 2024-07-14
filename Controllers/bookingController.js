const stripe = require('stripe')('sk_test_51Pc5foRwYs7KwOQkTZZ4jYvD3WC8arQPT1WlXYQz1SRrbdx2QBqvE57cOrIiVK7CbYUC5aehWj8VSK0e6bnODNPP00YxEhUnmG');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('./../Utils/appError');
const factory = require('./handllerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    // 2) Create checkout Session
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', // Ensure the mode parameter is set
            success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
            cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
            customer_email: req.user.email,
            client_reference_id: req.params.tourID, 
            line_items: [
                {
                    price_data: { 
                        currency: 'usd',
                        product_data: {
                            name: `${tour.name} Tour`,
                            description: tour.summary,
                            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                        },
                        unit_amount: tour.price * 100,
                    },
                    quantity: 1, 
                },
            ],
        });

        // 3) Create session as response
        res.status(200).json({
            status: 'success',
            session,
        });
    } catch (err) {
        console.error('Error creating Stripe session:', err);
        next(new AppError('Error creating checkout session. Please try again.', 500));
    }
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
    const { tour, user, price } = req.query;
  
    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });
  
    res.redirect(req.originalUrl.split('?')[0]);
  });

exports.createBooking = factory.createOne(Booking);

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);