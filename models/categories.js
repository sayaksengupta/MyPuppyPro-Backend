const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: false
  },
  breeds: [
    {
        _id : mongoose.Types.ObjectId
    }
  ],
  image: String
});

const Category = mongoose.model("CATEGORIES", categorySchema);
module.exports = Category;