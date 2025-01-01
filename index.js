require("dotenv").config();
const { Telegraf, session, Markup } = require("telegraf");
const { mongoose } = require("mongoose");
const fs = require("fs");
const axios = require("axios");
const {
  findUserByIdOrCreate,
  getAllUsers,
} = require("./database/Response/User");
const {
  setTitle,
  setTitleSlide,
  setBackgroundSlide,
  updateLastSlideText,
  seeSLides,
  setTextSlide,
  removeBackgroundLastSlide,
  updateLastSlideTitle,
  setDisCountDownLoad,
  removePresentation,
  removeLastSlide,
  getLastSlide,
  setCountDownLoad,
} = require("./database/Response/Presintation");
const { createPresentation } = require("./make/create_file");
const { generatePresentation } = require("./make/chatgpt");
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
    const chatID = await ctx.from.id;
    const firstName = await ctx.from.first_name;
    const isPremium = (await ctx.from.is_premium) || false;
    const userId = await ctx.from.username;
    if (!userId) return await ctx.reply("Поставьте username в профиле!");
    console.log(ctx.from);
    console.log(`Запуск от ${firstName}, ${userId}`);
    let create = await findUserByIdOrCreate(
      userId,
      firstName,
      chatID,
      isPremium,
      ctx
    );
    if (!create.success) return await ctx.reply("Попробуй снова /start");
    if (userId === "O101O1O1O") {
      await ctx.reply(
        `Привет, ${firstName}! 👋`,
        Markup.keyboard([["👱 Режим смертного"], ["👁️ Режим бога"]])
          .resize()
          .oneTime()
      );
    } else {
      await ctx.reply(`Привет, ${firstName}! 👋`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Начать!", callback_data: "get_title_pricentation" }],
          ],
        },
      });
    }
  } catch (e) {
    console.log(e);
  }
});

bot.action("get_title_pricentation", (ctx) => {
  ctx.replyWithHTML(
    "Введите название презентации\n\nНапример: <i>Мода 19-го века в России</i>\n\n<b>Максимум 7 слайдов!</b>"
  );
  ctx.session.expecting = "slideName";
  ctx.answerCbQuery();
});

let themes = [
  {
    name: "Blue",
  },
  {
    name: "Turquoise",
  },
  {
    name: "Red",
  },
  {
    name: "Orange",
  },
  {
    name: "Green",
  },
  {
    name: "Purple",
  },
  {
    name: "Yellow",
  },
  {
    name: "Light_Green",
  },
];

bot.action("getUserData", async (ctx) => {
  if (ctx.from.username !== "O101O1O1O")
    return ctx.reply("Слыш, у тебя прав нет!");
  let getData = await getAllUsers();

  // getData.users.forEach(async (user) => {
  //   await ctx.replyWithHTML(
  //     `<a href="https://t.me/${user.userID}">${user.firstName}</a>${
  //       user.isPremium ? " - 🪙" : ""
  //     }`,
  //     { disable_web_page_preview: true }
  //   );
  // });
  ctx.answerCbQuery();
});

bot.action("getContUser", async (ctx) => {
  if (ctx.from.username !== "O101O1O1O")
    return ctx.reply("Слыш, у тебя прав нет!");
  let getData = await getAllUsers();
  await ctx.replyWithHTML(`${getData.users.length} - активных пользователей!`);
  ctx.answerCbQuery();
});

bot.action("sendAdd", async (ctx) => {
  const userId = await ctx.from.username;
  ctx.session.expecting = null;
});

bot.action("cancel", (ctx) => {
  ctx.reply("Отмена рассылки");
  ctx.session.expecting = null;
  ctx.answerCbQuery();
});

bot.action("add", (ctx) => {
  ctx.reply("Напишите рекламный текст! Можно с картинкой", {
    reply_markup: {
      inline_keyboard: [[{ text: "❌ Отмена", callback_data: "cancel" }]],
    },
  });
  ctx.session.expecting = "sendAdd";
  ctx.answerCbQuery();
});

bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = await ctx.from.username;
  await ctx.answerCbQuery(`Вы выбрали тему: ${callbackData}`);
  let getPresintation = await seeSLides(userId);
  if (!getPresintation.success)
    return ctx.reply("❌ Возникла ошибка при получении презентации :(");
  let countDown = await setCountDownLoad(userId);
  let result = 5 - countDown.count.countDownLoad;
  if (result <= 0) return ctx.reply("❌ Загрузки закончились :(");
  await ctx.reply("⚙️ Генерация...");

  let giminiPres = await generatePresentation(
    getPresintation.presintation.title
  );
  let createPresentationOfUser = await createPresentation(
    giminiPres,
    Number(callbackData) - 1,
    userId
  );
  if (!createPresentationOfUser.success) {
    let decrement = await setDisCountDownLoad(userId);
    console.log(
      decrement.success
        ? "Добавили попытку у "
        : "Ошибка при добавлении попытки у ",
      userId
    );
    return ctx.reply("❌ Ошибка!");
  }
  await ctx.replyWithHTML(
    `📩 Отправка, не забудте поблагодарить <a href='https://t.me/O101O1O1O'>создателя!</a>\n<b>Осталось ${
      result - 1
    } скачиваний</b>`
  );
  await ctx.sendDocument({
    source: `./storage/${userId}.pptx`,
  });
  return;
});

bot.hears("👱 Режим смертного", async (ctx) => {
  await ctx.reply(`Привет, повелитель! 👋`);
  await ctx.replyWithHTML(
    "Введите название презентации\n\nНапример: <i>Мода 19-го века в России</i>\n\n<b>Максимум 7 слайдов!</b>",
    Markup.keyboard([["📥 Скачать"]])
      .resize()
      .oneTime()
  );
  ctx.session.expecting = await "slideName";
});

bot.hears("👁️ Режим бога", async (ctx) => {
  const userId = await ctx.from.username;
  const firstName = await ctx.from.first_name;

  if (userId === "O101O1O1O") {
    ctx.reply(`Госпадин, ${firstName}, что вам угодно?`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "👁️ Информация о пользователях",
              callback_data: "getUserData",
            },
          ],
          [
            {
              text: "➕ Добавить в черный список",
              callback_data: "addBlackList",
            },
          ],
          [
            {
              text: "1️⃣ Посмотреть количество пользователей",
              callback_data: "getContUser",
            },
          ],
          [
            {
              text: "📢 Реклама",
              callback_data: "add",
            },
          ],
        ],
      },
    });
  } else {
    await ctx.reply(
      `Слыш, у тебя нет прав!`,
      Markup.keyboard([["📥 Скачать"]])
        .resize()
        .oneTime()
    );
  }
  ctx.session.expecting = await null;
});

async function addvenset(ctx, text, fileId) {
  // Получаем chatId всех пользователей
  let getChatID = await (await getAllUsers()).users.map((user) => user.chatID);

  // Обрабатываем каждого пользователя
  for (const chatId of getChatID) {
    try {
      if (fileId) {
        // Отправляем фотографию
        await ctx.telegram.sendPhoto(chatId, fileId, {
          caption: text,
          parse_mode: "HTML",
        });
      } else {
        // Отправляем текстовое сообщение
        await ctx.telegram.sendMessage(chatId, text, {
          parse_mode: "HTML",
        });
      }
    } catch (error) {
      if (error.response && error.response.error_code === 403) {
        // Если пользователь заблокировал бота
        console.log(
          `Пользователь с chat_id ${chatId} заблокировал бота. Пропускаем.`
        );
      } else {
        // Логируем другие ошибки
        console.error(
          `Ошибка при отправке сообщения пользователю ${chatId}:`,
          error
        );
      }
    }
  }

  // После завершения рассылки выводим результат
  console.log(`Рассылка прошла успешно на ${getChatID.length} пользователей!`);
}

bot.on("text", async (ctx) => {
  try {
    const userId = ctx.from.username;
    let type = ctx.session.expecting;
    if (ctx.message.text === "📥 Скачать") {
      let media = [];
      themes.forEach((thema) => {
        media.push({
          type: "photo",
          media: { source: `./icons/${thema.name}.png` },
        });
      });
      await ctx.replyWithMediaGroup(media);
      await ctx.reply("Выберите тему:", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "1",
                callback_data: "1",
              },
              {
                text: "2",
                callback_data: "2",
              },
            ],
            [
              {
                text: "3",
                callback_data: "3",
              },
              {
                text: "4",
                callback_data: "4",
              },
            ],
            [
              {
                text: "5",
                callback_data: "5",
              },
              {
                text: "6",
                callback_data: "6",
              },
            ],
            [
              {
                text: "7",
                callback_data: "7",
              },
              {
                text: "8",
                callback_data: "8",
              },
            ],
          ],
        },
      });
      return;
    }

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
      return ctx.reply(
        "Название презентации сохранено!",
        Markup.keyboard([["📥 Скачать"]])
          .resize()
          .oneTime()
      );
    }
  } catch (e) {
    console.log(e);
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
