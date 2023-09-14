const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const orderSchema = new mongoose.Schema(
  {
    dog: {
      type: mongoose.Types.ObjectId,
      ref: "DOGS",
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    amount: Number,
    orderId: String,
    status: {
      type: Number,
      eNum: [0, 1, 2], //0 for processing, 1 for success, 2 for failed
    },
    paymentMode: String,
    txnId: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Orders", orderSchema);
module.exports = Order;
