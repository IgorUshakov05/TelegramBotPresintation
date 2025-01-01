const PptxGenJS = require("pptxgenjs");
const path = require("path");
let themes = [
  {
    name: "Blue",
    backgroundColor: "#4A90E2",
    textColor: "#FFFFFF",
  },
  {
    name: "Turquoise",
    backgroundColor: "#50E3C2",
    textColor: "#FFFFFF",
  },
  {
    name: "Red",
    backgroundColor: "#D0021B",
    textColor: "#FFFFFF",
  },
  {
    name: "Orange",
    backgroundColor: "#F5A623",
    textColor: "#FFFFFF",
  },
  {
    name: "Green",
    backgroundColor: "#7ED321",
    textColor: "#FFFFFF",
  },
  {
    name: "Purple",
    backgroundColor: "#9013FE",
    textColor: "#FFFFFF",
  },
  {
    name: "Yellow",
    backgroundColor: "#F8E71C",
    textColor: "#333333",
  },
  {
    name: "Light_Green",
    backgroundColor: "#B8E986",
    textColor: "#333333",
  },
];

function createPresentation(slidesData, thema = 0, name) {
  console.log(slidesData);
  // Создаем новую презентацию
  let pptx = new PptxGenJS();

  try {
    // Добавляем титульный слайд
    let titleSlide = pptx.addSlide();
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: { color: themes[thema].backgroundColor },
    });
    titleSlide.addText(slidesData.title, {
      x: 1,
      y: "50%",
      align: "center",
      bold: true,
      fontSize: Math.min(24, 500 / slidesData.title.length + 10), // Адаптивный размер шрифта
      color: themes[thema].textColor,
    });

    titleSlide.addImage({
      path: path.join(__dirname, "..", "pictures", "logo.png"),
      x: "88%",
      y: "4%",
      w: 1,
      h: 1,
      rounding: true,
      roundingRadius: 0.2,
      align: "right",
    });

    // Добавляем слайды из slidesData
    slidesData.sliders.forEach((slide) => {
      let slideItem = pptx.addSlide();

      // Добавляем фоновое изображение, если оно указано
      if (slide.background) {
        slideItem.addImage({
          path: path.join(
            __dirname,
            "..",
            "pictures",
            `${slide.background}.jpg`
          ),
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
          sizing: { type: "contain", w: "100%", h: "100%" },
        });

        slideItem.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
          fill: { color: themes[thema].backgroundColor, transparency: 50 },
        });
      } else {
        slideItem.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
          fill: { color: themes[thema].backgroundColor },
        });
      }

      // Автоматическая адаптация текста по длине
      const titleFontSize = 15;
      const textFontSize = Math.min(14, 500 / (slide.text.length / 2) + 10);

      slideItem.addText(slide.title, {
        x: 1,
        y: 1,
        bold: true,

        w: "80%", // Достаточная ширина для текста
        fontSize: titleFontSize,
        color: themes[thema].textColor,
        valign: "top", // Размещение сверху
      });

      // Если есть изображение
      if (slide.image) {
        slideItem.addImage({
          path: path.join(__dirname, "..", "pictures", `${slide.image}.jpg`),
          x: "60%",
          y: "25%",
          w: 2.5,
          h: 2.5,
          align: "right",
        });
      }

      // Обрезка текста, если он слишком длинный
      let text = slide.text;
      slideItem.addText(text, {
        x: 1,
        y: slide.image ? 2.4 : 2, // Учитываем позицию изображения
        w: "80%", // Достаточная ширина
        fontSize: textFontSize,
        color: themes[thema].textColor,
        valign: "top",
      });
    });

    // Сохраняем файл и возвращаем результат
    return pptx
      .writeFile({
        fileName: path.join(__dirname, "..", "storage", `${name}.pptx`),
      })
      .then(() => ({ success: true }))
      .catch((err) => {
        console.error("Ошибка при сохранении презентации:", err);
        return { success: false };
      });
  } catch (error) {
    console.error("Ошибка при создании презентации:", error);
    return { success: false };
  }
}

module.exports = { createPresentation };
