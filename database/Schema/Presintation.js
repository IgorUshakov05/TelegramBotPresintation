const mongoose = require("mongoose");

const slideItem = new mongoose.Schema({
  title: {
    type: String,
    require: false,
  },
  text: {
    type: String,
  },
});
const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  sliders: [slideItem],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
