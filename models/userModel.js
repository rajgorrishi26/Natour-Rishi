const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { type } = require('os');

const userSchema = mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please tell us your Name!'],
   },
   email: {
      type: String,
      required: [true, 'Please tell us your Email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please Provide a valid Email']
   },
   photo: {type:String , default:'default.jpg'},
   role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
   },
   password: {
      type: String,
      required: [true, 'Please Provide Your Password!'],
      minlength: 8,
      select: false
   },
   passwordConfirm: {
      type: String,
      required: [true, 'Please Confirm Your Password!'],
      validate: {
         // this only work on CREATE and SAVE!!
         validator: function (el) {
            return el === this.password;
         },
         message: 'Password are not the same!!'
      }
   },
   passwordChangedAt: Date, 

   passwordResetToken: String,

   passwordResetExpires: Date,
    
   active:{
      type:Boolean,
      default:true,
      select:false
   }


});

userSchema.pre('save', async function (next) {
   // only Run this function if password was actually modified
   if (!this.isModified('password')) return next();

   //Hash the password with cost of 12 
   this.password = await bcrypt.hash(this.password, 12);

   //delete the passwordConfirm
   this.passwordConfirm = undefined;
   next();
});
userSchema.pre('save', function(next) {
if (!this.isModified('password') || this.isNew) {
   return next();
}
this.passwordChangedAt = Date.now() - 1000;
next();
});

userSchema.pre(/^find/, function(next) {
   // this points to the current query
   this.find({ active: { $ne: false } });
   next();
 });
// this is called instance methods and it can be available on any UserModel object
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
   return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
   if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
         this.passwordChangedAt.getTime() / 1000,
         10
      );

      return JWTTimestamp < changedTimestamp;
   }

   // False means NOT changed
   return false;
};
// Method to generate and set password reset token
userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex');
   this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
   this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
   console.log({ resetToken }, this.passwordResetToken);
   return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;