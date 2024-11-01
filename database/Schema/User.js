const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  chatID: {
    type: String,
    require: true,
    unique: true,
  },
  isPremium: {
    type: Boolean,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
