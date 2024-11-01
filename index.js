require("dotenv").config();
const { Telegraf } = require("telegraf");
const { mongoose } = require("mongoose");
const { findUserByIdOrCreate } = require("./database/Response/User");
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.command("hipster", Telegraf.reply("λ"));

bot.command("start", async (ctx) => {
  try {
    const chatID = ctx.from.id; //
    const firstName = ctx.from.first_name;
    const isPremium = ctx.from.is_premium || false;
    const userId = ctx.from.username;
    const messageText = ctx.message.text;
    await findUserByIdOrCreate(userId, firstName, chatID, isPremium);
    ctx.reply(`Привет, ${firstName}! 👋`);
    ctx.reply(`Бот на стадии разработки! Пошли вон`);
    return;
  } catch (e) {
    console.log(e);
    return false;
  }
});
let start = async () => {
  try {
    let databaseCon = await mongoose.connect("mongodb://127.0.0.1:27017/bot");
    if (databaseCon) console.log("Connect to database");
    await bot.launch(() => {
      console.log("Bot was starting");
    });
  } catch (e) {
    console.log(e);
  }
};
start();
