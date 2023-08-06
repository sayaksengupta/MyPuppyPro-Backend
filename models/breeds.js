const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const breedSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: false
  },
  image: String
});

const Breed = mongoose.model("Breed", breedSchema);
module.exports = Breed;