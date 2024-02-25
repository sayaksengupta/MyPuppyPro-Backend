const mongoose = require("mongoose");
const settingSchema = new mongoose.Schema(
  {
    breederPlan: {
      amount: Number,
      duration: Number,
    },
    puppyListing: Number,
  },
  { timestamps: true }
);

const Setting = mongoose.model("Settings", settingSchema);
module.exports = Setting;
