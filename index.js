require("dotenv").config();
const { Telegraf, session, Markup } = require("telegraf");
const { mongoose } = require("mongoose");
const fs = require("fs");
const axios = require("axios");
const sharp = require("sharp");
const { findUserByIdOrCreate } = require("./database/Response/User");
const {
  setTitle,
  setTitleSlide,
  setBackgroundSlide,
  updateLastSlideText,
  setTextSlide,
  removeBackgroundLastSlide,
  updateLastSlideTitle,
  removePresentation,
  removeLastSlide,
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
    await ctx.reply(
      `Привет, ${firstName}! 👋`,
      Markup.keyboard([
        ["📥 Скачать"], // первая строка клавиатуры
        ["🗑️ Удалить презентацию"], // вторая строка клавиатуры
        ["👁️ Просмотреть"], // вторая строка клавиатуры
      ])
        .resize() // подгоняет клавиатуру под размер кнопок
        .oneTime()
    );
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

bot.action("removeSlide", async (ctx) => {
  let userID = ctx.from.username;
  let removeSlide = await removeLastSlide(userID);
  if (!removeSlide.success) {
    ctx.reply("Слайдов больше нет!");
  } else {
    await ctx.reply("Последний слайд удален", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
        ],
      },
    });
  }
  ctx.session.expecting = "remove_slide";
  await ctx.answerCbQuery();
});

bot.action("remove_background_slide", async (ctx) => {
  let userID = ctx.from.username;
  let removeSlide = await removeBackgroundLastSlide(userID);
  if (!removeSlide.success) {
    ctx.reply(removeSlide.message);
  } else {
    await ctx.reply("Фон слайда успешно удален!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
        ],
      },
    });
  }
  ctx.session.expecting = "slideBackground";
  await ctx.answerCbQuery();
});

bot.action("set_text_slide", (ctx) => {
  ctx.reply("Введите текст слайда");
  ctx.session.expecting = "slideText";
  ctx.answerCbQuery();
});

bot.action("reset_title_slide", (ctx) => {
  ctx.reply("Введите название слайда");
  ctx.session.expecting = "slideResetTitle";
  ctx.answerCbQuery();
});

bot.action("reset_text_slide", (ctx) => {
  ctx.reply("Введите текст слайда");
  ctx.session.expecting = "slideResetText";
  ctx.answerCbQuery();
});
bot.action("set_background_slide", (ctx) => {
  ctx.replyWithHTML("🖼️ Отправте фон слайда <i>(необязательно)</i>", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
        [
          {
            text: "🚮 Удалить последний слайд",
            callback_data: "removeSlide",
          },
        ],
      ],
    },
  });
  ctx.session.expecting = "slideBackground";
  ctx.answerCbQuery();
});

bot.action("reset_background_slide", (ctx) => {
  ctx.replyWithHTML("🖼️ Отправте фон слайда <i>(необязательно)</i>", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],

        [{ text: "🚮 Удалить фон", callback_data: "remove_background_slide" }],
        [
          {
            text: "🚮 Удалить последний слайд",
            callback_data: "removeSlide",
          },
        ],
      ],
    },
  });
  ctx.session.expecting = "reset_background_slide";
  ctx.answerCbQuery();
});

bot.hears("🗑️ Удалить презентацию", async (ctx) => {
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
              {
                text: "◀️ Изменить название",
                callback_data: "get_title_pricentation",
              },
              { text: "➕ Добавить слайд", callback_data: "new_slide" },
            ],
          ],
        },
      });
    } else if (type === "slideResetTitle") {
      let saveTitle = await updateLastSlideTitle(userId, text);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("❌ Нет слайдов для обновления!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
            ],
          },
        });
      }
      ctx.session.expecting = null;
      return ctx.reply("✅ Название слайда изменено!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏭️ Продолжить", callback_data: "set_text_slide" }],
            [
              {
                text: "🔄 Изменить заголовок",
                callback_data: "reset_title_slide",
              },
            ],
            [{ text: "🚮 Удалить слайд", callback_data: "removeSlide" }],
          ],
        },
      });
    } else if (type === "slideResetText") {
      let saveTitle = await updateLastSlideText(userId, text);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("❌ Нет слайдов для обновления!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
            ],
          },
        });
      }
      ctx.session.expecting = null;
      return ctx.reply("✅ Текст слайда изменен!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏭️ Продолжить", callback_data: "set_background_slide" }],
            [
              {
                text: "🔄 Изменить текст",
                callback_data: "reset_text_slide",
              },
            ],
            [{ text: "🚮 Удалить слайд", callback_data: "removeSlide" }],
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
      return ctx.reply("✅ Название слайда сохранено!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏭️ Продолжить", callback_data: "set_text_slide" }],
            [
              {
                text: "🔄 Изменить заголовок",
                callback_data: "reset_title_slide",
              },
            ],
            [{ text: "🚮 Удалить слайд", callback_data: "removeSlide" }],
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

      return await ctx.replyWithHTML(`✅ Текст слайда сохранен!`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⏭️ Продолжить",
                callback_data: "set_background_slide",
              },
            ],
            [
              {
                text: "🔄 Изменить текст",
                callback_data: "reset_text_slide",
              },
            ],
            [{ text: "🚮 Удалить слайд", callback_data: "removeSlide" }],
          ],
        },
      });
    }
  } catch (e) {
    console.log(e);
    return ctx.reply("Я сломался, напиши @O101O1O1O");
  }
});
bot.on("photo", async (ctx) => {
  try {
    const userId = ctx.from.username;
    let type = ctx.session.expecting;
    console.log(type);
    if (!type) {
      ctx.session.expecting = null;
      return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
    }

    let text = ctx.message.text;
    if (type === "slideBackground" || type === "reset_background_slide") {
      // Получаем информацию о фотографиях
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id;
      let saveTitle = await setBackgroundSlide(userId, fileId);
      if (!saveTitle || !saveTitle.success) {
        ctx.session.expecting = null;
        return ctx.reply("Сейчас чуть-чуть не пон, перезапусти меня /start");
      }
      // Получаем URL файла
      const fileUrl = await ctx.telegram.getFileLink(fileId);

      // Загружаем изображение с помощью axios
      const response = await axios.get(fileUrl.href, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data, "binary");

      // Сохраняем изображение

      await fs.writeFileSync(`./pictures/${fileId}.jpg`, buffer);
      ctx.session.expecting = null;
      let lastSlideInfo = await getLastSlide(userId);
      console.log(lastSlideInfo);
      if (lastSlideInfo.data.background) {
        return ctx.replyWithPhoto(
          { url: fileUrl },
          {
            caption: `✅ Сохранено\n<b>${lastSlideInfo.data.title}</b>\n<code>${lastSlideInfo.data.text}</code>`,
            parse_mode: "HTML", // Чтобы работали теги <b> и <code>
            reply_markup: {
              inline_keyboard: [
                [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
                [
                  {
                    text: "🔄 Изменить фон слайда",
                    callback_data: "reset_background_slide",
                  },
                ],
                [
                  {
                    text: "🚮 Удалить последний слайд",
                    callback_data: "removeSlide",
                  },
                ],
              ],
            },
          }
        );
      }
      ctx.replyWithHTML(
        `✅ Сохранено\n<b>${lastSlideInfo.data.title}</b>\n<code>${lastSlideInfo.data.text}</code>`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Добавить слайд", callback_data: "new_slide" }],
              [
                {
                  text: "🔄 Изменить фон слайда",
                  callback_data: "set_background_slide",
                },
              ],
              [
                {
                  text: "🚮 Удалить последний слайд",
                  callback_data: "removeSlide",
                },
              ],
            ],
          },
        }
      );
    }
  } catch (error) {
    console.error("Ошибка при получении изображения:", error);
    await ctx.reply("Произошла ошибка при обработке изображения.");
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
