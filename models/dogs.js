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
  DOB: String,
  weight: Number,
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
      breed: String,
      DOB: String,
      weight: Number,
      image: String,
    },
    mother: {
      breed: String,
      DOB: String,
      weight: Number,
      image: String,
    },
    fratFather: {
      breed: String,
      DOB: String,
      weight: Number,
      image: String,
    },
    fratMother: {
      breed: String,
      DOB: String,
      weight: Number,
      image: String,
    },
    matFather: {
      breed: String,
      DOB: String,
      weight: Number,
      image: String,
    },
    matMother: {
      breed: String,
      DOB: String,
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
