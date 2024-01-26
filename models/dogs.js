const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    review: String,
    userName: String,
    dogName: String,
    breed: String,
    image: String,
  },
  { timestamps: true }
);

const dogSchema = new mongoose.Schema(
  {
    breed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Breed", // Replace 'Breed' with the actual model name for the breed schema
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Replace 'User' with the actual model name for the user schema
    },
    type: String,
    generic_name: String,
    age: Number,
    DOB: String,
    color: String,
    weight: Number,
    gender: String,
    disability: Boolean,
    address: String,
    availableDate: String,
    comments: String,
    price: Number,
    active: {
      type: Boolean,
      default: false,
    },
    soldStatus: {
      type: Boolean,
      default: false,
    },
    pedigree: {
      father: {
        breed: String,
        name: String,
        image: String,
      },
      mother: {
        breed: String,
        name: String,
        image: String,
      },
      fratFather: {
        breed: String,
        name: String,
        image: String,
      },
      fratMother: {
        breed: String,
        name: String,
        image: String,
      },
      matFather: {
        breed: String,
        name: String,
        image: String,
      },
      matMother: {
        breed: String,
        name: String,
        image: String,
      },
    },
    name: {
      type: String,
      trim: true,
    },
    averageRating: Number,
    ratings: [
      {
        userId: mongoose.Types.ObjectId,
        rating: Number,
      },
    ],
    reviews: [reviewSchema],
    images: [String],
  },
  { timestamps: true }
);

const Dog = mongoose.model("DOGS", dogSchema);
module.exports = Dog;
