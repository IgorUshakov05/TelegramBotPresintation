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
        Markup.keyboard([
          ["👱 Режим смертного"], // вторая строка клавиатуры
          ["👁️ Режим бога"],
        ])
          .resize() // подгоняет клавиатуру под размер кнопок
          .oneTime()
      );
    } else {
      await ctx.reply(
        `Привет, ${firstName}! 👋`,
        Markup.keyboard([
          ["📥 Скачать"], // первая строка клавиатуры
          ["🗑️ Удалить презентацию"], // вторая строка клавиатуры
          ["👁️ Просмотреть"],
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
    }
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

bot.action("getUserData", async (ctx) => {
  if (ctx.from.username !== "O101O1O1O")
    return ctx.reply("Слыш, у тебя прав нет!");
  let getData = await getAllUsers();
  getData.users.forEach(async (user) => {
    await ctx.replyWithHTML(
      `<a href="https://t.me/${user.userID}">${user.firstName}</a>${
        user.isPremium ? " - 🪙" : ""
      }`,
      { disable_web_page_preview: true }
    );
  });
  ctx.answerCbQuery();
});

bot.action("getContUser", async (ctx) => {
  if (ctx.from.username !== "O101O1O1O")
    return ctx.reply("Слыш, у тебя прав нет!");
  let getData = await getAllUsers();
  await ctx.replyWithHTML(`${getData.users.length} - активных пользователей!`);
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
bot.action("sendAdd", async (ctx) => {
  const userId = await ctx.from.username;

  ctx.session.expecting = null; // Очищаем состояние
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
  let result = 10 - countDown.count.countDownLoad;
  if (result <= 0) return ctx.reply("❌ Загрузки закончились :(");
  await ctx.reply("⚙️ Генерация...");

  let createPresentationOfUser = await createPresentation(
    getPresintation.presintation,
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
    `📩 Отправка, не забудте поблагодарить <a href='https://t.me/O101O1O1O'>создателя!</a>\n<b>Осталось ${result} скачиваний</b>`
  );
  await ctx.sendDocument({
    source: `./storage/${userId}.pptx`,
  });
  return;
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
bot.hears("👱 Режим смертного", async (ctx) => {
  await ctx.reply(
    `Привет, повелитель! 👋`,
    Markup.keyboard([
      ["📥 Скачать"], // первая строка клавиатуры
      ["🗑️ Удалить презентацию"], // вторая строка клавиатуры
      ["👁️ Просмотреть"],
    ])
      .resize() // подгоняет клавиатуру под размер кнопок
      .oneTime()
  );
  await ctx.reply("Введите название презентации");
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
      Markup.keyboard([
        ["📥 Скачать"], // первая строка клавиатуры
        ["🗑️ Удалить презентацию"], // вторая строка клавиатуры
        ["👁️ Просмотреть"],
      ])
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
    } else if (ctx.message.text === "🗑️ Удалить презентацию") {
      return ctx.reply("Презентация удалена!");
    } else if (ctx.message.text === "👁️ Просмотреть") {
      let getPresintation = await seeSLides(userId);
      if (!getPresintation.success)
        return ctx.reply("❌ Возникла ошибка при получении презентации :(");
      if (!getPresintation?.presintation?.sliders.length)
        return ctx.reply("Презентация пустая!");

      await ctx.replyWithHTML(
        `Название: <b>${getPresintation.presintation.title}</b>`
      );

      for (const slide of getPresintation.presintation.sliders) {
        if (slide.background) {
          await ctx.replyWithPhoto(
            { source: `./pictures/${slide.background}.jpg` },
            {
              caption: `<b>${slide.title || "Заголовок не задан"}</b>\n<i>${
                slide.text || "Текст не задан"
              }</i>`,
              parse_mode: "HTML", // Используем HTML, а не Markdown
            }
          );
        } else {
          await ctx.replyWithHTML(
            `<b>${slide.title || "Заголовок не задан"}</b>\n<i>${
              slide.text || "Текст не задан"
            }</i>`
          );
        }
      }
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
    } else if (type === "sendAdd") {
      // Проверяем пользователя, прежде чем продолжать
      if (userId !== "O101O1O1O") {
        return ctx.reply("Ты кто вообще такой");
      }
      const text = ctx.message?.text;
      await addvenset(ctx, text);
      ctx.session.expecting = null;
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
    } else if (type === "sendAdd") {
      // Проверяем пользователя, прежде чем продолжать
      if (userId !== "O101O1O1O") {
        return ctx.reply("Ты кто вообще такой");
      }

      // Если пользователь авторизован, обрабатываем сообщение
      const photos = await ctx.message?.photo;
      const text = await ctx.message?.caption;
      const fileId = await photos[photos.length - 1].file_id;
      await addvenset(ctx, text, fileId);
      ctx.session.expecting = null;
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
