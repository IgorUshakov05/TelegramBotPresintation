const User = require("../Schema/User");
const PresentationSchema = require("../Schema/Presintation");

let findUserByIdOrCreate = async (userID, firstName, chatID, isPremium) => {
  try {
    let find = await User.findOne({ userID });
    let findPresintation = await PresentationSchema.findOne({ userID });
    if (findPresintation) {
      await PresentationSchema.deleteOne({ userID });
    }
    await PresentationSchema.create({ userID });
    if (!find) {
      console.log("Новый пользователь!");
      console.log(isPremium);
      await User.create({ userID, firstName, chatID, isPremium });
    }
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

module.exports = { findUserByIdOrCreate };
