const mongoose = require("mongoose");
const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true
    },
  },
  { timestamps: true }
);

const City = mongoose.model("Cities", stateSchema);
module.exports = City;
