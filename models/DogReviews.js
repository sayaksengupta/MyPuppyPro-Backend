const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dogReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    dogId: {
      type: mongoose.Types.ObjectId,
      ref: "DOGS",
    },
    userName: String,
    dogName: String,
    breed: String,
    image: String,
    review: String,
    ratings: [
      {
        userId: mongoose.Types.ObjectId,
        rating: Number,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DogReview = mongoose.model("dogReview", dogReviewSchema);
module.exports = DogReview;
