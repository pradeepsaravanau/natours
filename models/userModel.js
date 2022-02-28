const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //we cannot use arrow
      //this only works on CREATE and SAVE!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  confirmEmail: {
    type: Boolean,
    default: false
  },
  confirmEmailToken: Number,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});
//pre save runs b/w b/w getting the data and storing data
userSchema.pre('save', async function(next) {
  //Only run this function if password was modified
  if (!this.isModified('password')) return next();
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete the confirm password it validates in the pre step before this middleware is called so we can remove this save the 1kb 😂😂
  //by the way the required in the  model is only when we input the data
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function(next) {
  //when a new doc created isNew is true
  if (!this.isModified('password') || this.isNew) return next();
  //subrtact by 1000 coz jwt automatically sets the time for jwt token creation since in this middleware executed after we just pretend that date is less than 1000ms which is 1s , so jwt creation time will be greater the password changed at time
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function(next) {
  //this points to current query
  this.find({ active: { $ne: false } });
  next();
});
//instace method is available on all documents of certain collections
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  //this keyword is set to documents
  //this.password is not present since we set select : false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    //getTime is milliseconds divide by thousand and parse the entire thing as integer parseInt with base 10
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //checks the password change after jwt token issue
    return JWTTimestamp < changedTimeStamp;
  }
  //false means not changed
  //if user not changed password
  return false;
};
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //10 minutes extra
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
