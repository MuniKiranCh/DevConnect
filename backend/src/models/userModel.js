const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong enough");
        }
      },
    },
    passwordVersion: {
      type: Number,
      default: 1,
    },
    age: {
      type: Number,
      min: 15,
      max: 100,
      default: null,
    },
    gender: {
      type: String,
      validate(value) {
        if (value && !["male", "female", "others"].includes(value)) {
          throw new Error("Invalid gender");
        }
      },
      default: null,
    },
    photoUrl: {
      type: String,
      default:
        "https://toppng.com/public/uploads/preview/donna-picarro-dummy-avatar-115633298255iautrofxa.png",
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    location: {
      type: String,
      default: "",
      maxlength: 100,
    },
    website: {
      type: String,
      default: "",
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid website URL");
        }
      },
    },
    github: {
      type: String,
      default: "",
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid GitHub URL");
        }
      },
    },
    linkedin: {
      type: String,
      default: "",
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid LinkedIn URL");
        }
      },
    },
    skills: {
      type: [String],
      default: [],
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    connections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getJWT = async function() {
  return await jwt.sign(
    { 
      _id: this._id,
      passwordVersion: this.passwordVersion 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);

// This code defines a Mongoose schema and model for a User in a MongoDB database.
// The User schema includes fields for name, email, and password, with validation rules.
// The model is then exported for use in other parts of the application.
// It uses Mongoose, a popular ODM (Object Data Modeling) library for MongoDB and Node.js.
// The schema ensures that the name is a string, the email is unique and in lowercase, and the password has a minimum length of 6 characters.
// The model is named 'User', which will be used to interact with the 'users' collection in the database.
