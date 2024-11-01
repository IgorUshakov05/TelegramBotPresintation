require("dotenv").config();
const { Telegraf, session } = require("telegraf");
const { mongoose } = require("mongoose");
const { findUserByIdOrCreate } = require("./database/Response/User");
const {
  setTitle,
  setTitleSlide,
  setTextSlide,
  removePresentation,
  getLastSlide,
} = require("./database/Response/Presintation");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// Инициализация сессии
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
});

bot.command("start", async (ctx) => {
  try {
    const chatID = ctx.from.id;
    const firstName = ctx.from.first_name;
    const isPremium = ctx.from.is_premium || false;
    const userId = ctx.from.username;
    await findUserByIdOrCreate(userId, firstName, chatID, isPremium);
    await ctx.reply(`Привет, ${firstName}! 👋`);
    await ctx.reply(`Бот на стадии разработки! Пошли вон`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Начать!", callback_data: "get_title_pricentation" }],
        ],
      },
    });
  } catch (e) {
    console.log(e);
  }
});

bot.action("get_title_pricentation", (ctx) => {
  ctx.reply("Введите название презентации");
  ctx.session.expecting = "slideName";
  ctx.answerCbQuery();
});

bot.action("new_slide", (ctx) => {
  ctx.reply("Введите название слайда");
  ctx.session.expecting = "slideTitle";
  ctx.answerCbQuery();
});

bot.action("set_text_slide", (ctx) => {
  ctx.reply("Введите текст слайда");
  ctx.session.expecting = "slideText";
  ctx.answerCbQuery();
});

bot.action("remove_presentation", async (ctx) => {
  const userId = await ctx.from.username;
  let remove_presentation = await removePresentation(userId);
  if (!remove_presentation.success) {
    await ctx.reply("Ошибка при удалении 🤕");
  }
  await ctx.reply("Презентация удалена! 🚮");
  await ctx.reply(`Создать новую презентацию?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Поехали!", callback_data: "get_title_pricentation" }],
      ],
    },
  });
  ctx.session.expecting = await null;
});
bot.on("text", async (ctx) => {
  try {
    const userId = ctx.from.username;
    let type = ctx.session.expecting;
    console.log(type);
    if (!type) {
      ctx.session.expecting = null;
      return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
    }

    let text = ctx.message.text;
    if (type === "slideName") {
      let saveTitle = await setTitle(userId, text);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
      }
      ctx.session.expecting = null;
      return ctx.reply("Название презентации сохранено!", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "◀️ Назад", callback_data: "get_title_pricentation" },
              { text: "➕ Добавить слайд", callback_data: "new_slide" },
            ],
          ],
        },
      });
    } else if (type === "slideTitle") {
      let saveTitle = await setTitleSlide(userId, text);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
      }
      ctx.session.expecting = null;
      return ctx.reply("Название слайда сохранено!", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🗑️ Удалить презентацию",
                callback_data: "remove_presentation",
              },
            ],
            [{ text: "📜 Текст презинтации", callback_data: "set_text_slide" }],
            [{ text: "📥 Скачать", callback_data: "download" }],
          ],
        },
      });
    } else if (type === "slideText") {
      let saveTitle = await setTextSlide(userId, text);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
      }
      ctx.session.expecting = null;
      let lastSlideInfo = await getLastSlide(userId);
      console.log(lastSlideInfo);
      return ctx.replyWithHTML(
        `Сохранено\n\n<b>${lastSlideInfo.data.title}</b>\n<code>${lastSlideInfo.data.text}</code>`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🗑️ Удалить презентацию",
                  callback_data: "remove_presentation",
                },
              ],
              [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
              [{ text: "📥 Скачать", callback_data: "download" }],
            ],
          },
        }
      );
    }

    ctx.session.expecting = await null;
    await ctx.answerCbQuery();
  } catch (e) {
    console.log(e);
    await ctx.answerCbQuery(); // Убедитесь, что ответ на callback
    return ctx.reply("Я сломался, напиши @O101O1O1O");
  }
});

let start = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/bot");
    console.log("Connected to database");

    await bot.launch();
    console.log("Bot is running");
  } catch (e) {
    console.log(e);
  }
};

start();
