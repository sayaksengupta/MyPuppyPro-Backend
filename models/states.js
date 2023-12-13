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

const State = mongoose.model("States", stateSchema);
module.exports = State;
