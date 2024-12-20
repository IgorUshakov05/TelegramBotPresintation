const PresentationSchema = require("../Schema/Presintation");
const fs = require("fs");
const path = require("path");
let setTitle = async (userID, text) => {
  try {
    let setTitle = await PresentationSchema.updateOne(
      { userID },
      { $set: { title: text } }
    );
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
let removeLastSlide = async (userID) => {
  try {
    const result = await PresentationSchema.findOneAndUpdate(
      { userID }, // Условие поиска по userID
      { $pop: { sliders: 1 } }, // Операция удаления последнего элемента из массива
      { new: true } // Опция возвращения обновленного документа
    );
    return { success: !!result.sliders.length };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Ошибка при удалении!" };
  }
};
let setTitleSlide = async (userID, text) => {
  try {
    // Используйте $set для обновления поля title
    let setTitle = await PresentationSchema.updateOne(
      { userID },
      { $push: { sliders: { title: text } } }
    );

    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

async function updateLastSlideTitle(userID, newTitle) {
  try {
    const presintation = await PresentationSchema.findOne({ userID });

    if (!presintation) {
      return { success: false, message: "Презентация не найдена" };
    }

    // Проверяем, есть ли слайды в массиве `sliders`
    if (presintation.sliders.length > 0) {
      // Находим последний слайд и обновляем его title
      const lastSlideIndex = presintation.sliders.length - 1;
      presintation.sliders[lastSlideIndex].title = newTitle;

      // Сохраняем обновленный документ
      await presintation.save();

     
      return { success: true };
    } else {
      return { success: false, message: "Нет слайдов для изменения" };
    }
  } catch (error) {
    console.error("Ошибка при обновлении title последнего слайда:", error);
    return { success: false, message: "Нет слайдов для изменения" };
  }
}

async function removeBackgroundLastSlide(userID) {
  try {
    const presintation = await PresentationSchema.findOne({ userID });

    if (!presintation) {
      return { success: false, message: "Презентация не найдена" };
    }

    // Проверяем, есть ли слайды в массиве `sliders`
    if (presintation.sliders.length > 0) {
      // Находим последний слайд и обновляем его title
      const lastSlideIndex = presintation.sliders.length - 1;
      removePicture(presintation.sliders[lastSlideIndex].background);
      presintation.sliders[lastSlideIndex].background = null;
      // Сохраняем обновленный документ
      await presintation.save();
      return { success: true };
    } else {
      return { success: false, message: "Нет фона для удаления" };
    }
  } catch (error) {
    console.error("Ошибка при обновлении title последнего слайда:", error);
    return { success: false, message: "Нет фона для удаления" };
  }
}

async function updateLastSlideText(userID, newText) {
  try {
    const presintation = await PresentationSchema.findOne({ userID });

    if (!presintation) {
      return { success: false, message: "Презентация не найдена" };
    }

    // Проверяем, есть ли слайды в массиве `sliders`
    if (presintation.sliders.length > 0) {
      // Находим последний слайд и обновляем его title
      const lastSlideIndex = presintation.sliders.length - 1;
      presintation.sliders[lastSlideIndex].text = newText;

      // Сохраняем обновленный документ
      await presintation.save();

      console.log(
        "Title последнего слайда обновлен:",
        presintation.sliders[lastSlideIndex]
      );
      return { success: true };
    } else {
      return { success: false, message: "Нет слайдов для изменения" };
    }
  } catch (error) {
    console.error("Ошибка при обновлении title последнего слайда:", error);
    return { success: false, message: "Нет слайдов для изменения" };
  }
}

let setBackgroundSlide = async (userID, background) => {
  try {
    // Находим документ с данным userID
    const presentation = await PresentationSchema.findOne({ userID: userID });

    if (!presentation || presentation.sliders.length === 0) {
      // Если документ или слайды не найдены
      return { success: false, message: "Document or slides not found" };
    }

    // Определяем индекс последнего слайда
    const lastIndex = presentation.sliders.length - 1;

    // Обновляем background последнего слайда
    presentation.sliders[lastIndex].background = background;
    await presentation.save();

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
};

let setTextSlide = async (userID, text) => {
  try {
    let setText = await PresentationSchema.updateOne(
      { userID },
      { $set: { "sliders.$[lastUnfilled].text": text } },
      {
        arrayFilters: [
          {
            "lastUnfilled.title": { $exists: true },
            "lastUnfilled.text": { $exists: false },
          },
        ],
        sort: { "sliders._id": -1 },
      }
    );

    return { success: setText.modifiedCount > 0 };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
function removePicture(title) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "../../pictures", `${title}.jpg`);
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err); // Передаем ошибку в catch
      } else {
        resolve(); // Успешное удаление
      }
    });
  });
}
let removePresentation = async (userID) => {
  try {
    let findAndRemove = await PresentationSchema.findOneAndUpdate(
      { userID },
      { $set: { sliders: [], title: null } }
    );

    if (findAndRemove) {
      for (const slide of findAndRemove.sliders) {
        if (slide.background) {
          try {
            await removePicture(slide.background);
          } catch (e) {
            console.error(`Ошибка при удалении изображения: ${e}`);
          }
        }
      }
      return { success: true };
    } else {
      return { success: false, message: "Презентация не найдена" };
    }
  } catch (e) {
    console.error(`Ошибка при удалении презентации: ${e}`);
    return { success: false, message: "Ошибка при удалении презентации" };
  }
};

let getLastSlide = async (userID) => {
  try {
    let findSlide = await PresentationSchema.findOne({ userID })
      .select("sliders")
      .slice("sliders", -1);
    return {
      success: true,
      data: {
        title: `${findSlide.sliders[0].title.slice(0, 30)}...`,
        text: `${findSlide.sliders[0].text.slice(0, 60)}...`,
        background: findSlide.sliders[0].background
          ? findSlide.sliders[0].background
          : null,
      },
    };
  } catch (e) {
    return { success: false };
  }
};
let setCountDownLoad = async (userID) => {
  try {
    let count = await PresentationSchema.findOneAndUpdate(
      { userID },
      { $inc: { countDownLoad: 1 } }
    );
    return { success: true, count };
  } catch (e) {
    console.error("Ошибка: ", e);
    return { success: false, message: e };
  }
};
let setDisCountDownLoad = async (userID) => {
  try {
    let count = await PresentationSchema.findOneAndUpdate(
      { userID },
      { $inc: { countDownLoad: -1 } }
    );
    return { success: true, count };
  } catch (e) {
    console.error("Ошибка: ", e);
    return { success: false, message: e };
  }
};
let seeSLides = async (userID) => {
  try {
    let getSlides = await PresentationSchema.findOne({ userID });
    return { success: true, presintation: getSlides };
  } catch (e) {
    console.error("Ошибка: ", e);
    return { success: false, message: e };
  }
};
module.exports = {
  setTitle,
  setTitleSlide,
  setCountDownLoad,
  removeLastSlide,
  updateLastSlideText,
  setBackgroundSlide,
  seeSLides,
  removeBackgroundLastSlide,
  setDisCountDownLoad,
  removePresentation,
  updateLastSlideTitle,
  setTextSlide,
  getLastSlide,
};
