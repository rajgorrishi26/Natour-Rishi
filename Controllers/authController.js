const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../Utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../Utils/appError');
const Email = require('./../Utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECERT, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output 
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};
// +++++++++++++++++++SIGN-UP PART++++++++++++++++++++++++++++++++++++
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });
//     const url = `${req.protocol}://${req.get('host')}/me`;
//   await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

// +++++++++++++++++++LOGIN PART++++++++++++++++++++++++++++++++++++
exports.login = catchAsync(async (req, res, next) => {
    // meaning cosnt email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body;

    // 1) check email and password is exist 
    if (!email || !password) {
        next(new AppError('Please Provide Email and Password!!', 400));
    }

    // 2)check user exsit and password is correct 
    /* this means User.findOne({email:email}) you can write both way if similar name than you can write like this!  */
    const user = await User.findOne({ email }).select('+password'); // here .select() is user for explicitly include password becase password ins't visible 

    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
        return next(new AppError("Incorrect Email or Password", 401));
    }

    // 3) If everything is okay than send token to client
    createSendToken(user, 201, res);
});
// +++++++++++++++++++LOGOUT PART++++++++++++++++++++++++++++++++++++
exports.Logout = (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(Date.now() + 10 * 1000), // Set to expire in 10 seconds
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};


// +++++++++++++++++++PROTECT MIDDLEWARE PART++++++++++++++++++++++++++++++++++++
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token || token === 'Loggedout') {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECERT);
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }

        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }

        req.user = currentUser;
        res.locals.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Token verification failed.', 401));
    }
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
      try {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECERT
        );
  
        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            // console.log("user not found!");
          return next();
        }
  
        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            // console.log("password changed");
          return next();
        }
  
        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        // console.log('loged in done');
        return next();
      }
       catch (err) {
        console.error(err)
        // console.log("somthing error occurs");
        return next();
      }
    }
    // console.log('user not login');
    next();
  };

// +++++++++++++++++++ RESTRICTION PART (ADMIN ACCESS PART) PART++++++++++++++++++++++++++++++++++++
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // console.log(req.user.role);
        // roles ['admin', 'lead-guide']. role='user'
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
};

// +++++++++++++++++++FORGET PASSWORD PART++++++++++++++++++++++++++++++++++++
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get User based on posted Email 
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError('There is no User with this email', 404));

    // 2) Generate the random reset token 
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) send it to user's email 
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

       await new Email(user,resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Please try again later.', 500));
    }
});

// +++++++++++++++++++RSET-PASSWORD PART+++++++++++++++++++++++++++++++++++++++++
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user on besd on the token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    // 2) id the toen not expired and there is user , set the password
    if (!user) {
        next(new AppError('Token has invalid or Expired !', 400));
    }
    // 3) Update changeedPasswordAt property for the user 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 4) Log the user in , send token 
    createSendToken(user, 201, res);
});


// +++++++++++++++++++UPDATE-PASSWORD PART++++++++++++++++++++++++++++++++++++
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});
