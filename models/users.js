const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type : String,
        trim : true
    },
    type: String,
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
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
    address : {
      line1 : String,
      line2 : String
    },
    phone : {
      type: String,
      unique: true
    },
    country: String,
    city: String,
    state: String,
    pincode: String,
    otp:{
      type : Number
    },
    liked_dogs: [{
      type: mongoose.Types.ObjectId,
      ref: "DOGS"
    }],
    active: {
      type: Boolean,
      default: false,
    },
})

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
    const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY, { expiresIn: '24d' });
    return token;
  } catch (e) {
    console.log(`Failed to generate token --> ${e}`);
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;