const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    userName: String,
    review: String,
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  type: String,
  email: {
    type: String,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email.");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    line1: String,
    line2: String,
  },
  phone: {
    type: String,
  },
  country: String,
  city: String,
  state: String,
  pincode: String,
  ratings: [
    {
      userId: mongoose.Types.ObjectId,
      rating: Number,
    },
  ],
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
  },
  otp: {
    type: Number,
  },
  liked_dogs: [
    {
      type: mongoose.Types.ObjectId,
      ref: "DOGS",
    },
  ],
  profileImg: {
    type: String,
  },
  preferences: [
    {
      name: String,
      breed: {
       type: mongoose.Types.ObjectId,
        ref: "Breed",
      },
      image: String
    }
  ],
  active: {
    type: Boolean,
    default: false,
  },
});

// Hashing Passwords

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    console.log(this.password);
  }
  next();
});

// Generating Auth Token

userSchema.methods.generateAuthToken = async function () {
  try {
    const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY, {
      expiresIn: "24d",
    });
    return token;
  } catch (e) {
    console.log(`Failed to generate token --> ${e}`);
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
