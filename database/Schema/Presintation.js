const mongoose = require("mongoose");

const PresintationSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
  },
  countDownLoad: {
    type: Number,
    default: 0
  },
  title: {
    type: String,
  },
});

const Presintation = mongoose.model("Presintation", PresintationSchema);

module.exports = Presintation;
