const mongoose = require("mongoose");

const slideItem = new mongoose.Schema({
  title: {
    type: String,
    require: false,
  },
  background: {
    type: String
  },
  text: {
    type: String,
  },
});
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
  sliders: [slideItem],
});

const Presintation = mongoose.model("Presintation", PresintationSchema);

module.exports = Presintation;
