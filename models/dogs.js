const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dogSchema = new mongoose.Schema({
  breed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Breed", // Replace 'Breed' with the actual model name for the breed schema
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Replace 'User' with the actual model name for the user schema
  },
  generic_name: String,
  age: String,
  gender: String,
  disability: Boolean,
  address: String,
  comments: String,
  price: Number,
  soldStatus: {
    type: Boolean,
    default: false,
  },
  pedigree: {
    father: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
    mother: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
    fratFather: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
    fratMother: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
    matFather: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
    matMother: {
      breed: mongoose.Schema.Types.ObjectId,
      DOB: Date,
      weight: Number,
      image: String,
    },
  },
  name: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  image: String,
});

const Dog = mongoose.model("DOGS", dogSchema);
module.exports = Dog;
