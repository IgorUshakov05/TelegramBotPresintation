const User = require("../Schema/User");

let findUserByIdOrCreate = async (userID, firstName, chatID, isPremium) => {
  try {
    let find = await User.findOne({ userID });
    if (!find) {
      console.log("Новый пользователь!");
      console.log(isPremium);
      let newUser = await User.create({ userID, firstName, chatID, isPremium });
    }
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

module.exports = { findUserByIdOrCreate };
