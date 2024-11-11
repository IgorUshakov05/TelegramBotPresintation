const User = require("../Schema/User");
const PresentationSchema = require("../Schema/Presintation");

let findUserByIdOrCreate = async (
  userID,
  firstName,
  chatID,
  isPremium,
  ctx
) => {
  try {
    let find = await User.findOne({ userID });
    let findPresintation = await PresentationSchema.findOne({ userID });
    if (findPresintation) {
      await PresentationSchema.updateOne(
        { userID },
        { $set: { title: null, sliders: [] } }
      );
    } else {
      await PresentationSchema.create({ userID });
    }
    if (!find) {
      console.log("Новый пользователь!");
      await ctx.telegram.sendMessage(
        "6058556672",
        `Новый пользователь: ${firstName} - @${userID}`,
        {
          parse_mode: "HTML",
        }
      );
      await User.create({ userID, firstName, chatID, isPremium });
    }
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

let getAllUsers = async () => {
  try {
    let users = await User.find({});
    return { success: true, users };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
module.exports = { findUserByIdOrCreate, getAllUsers };
