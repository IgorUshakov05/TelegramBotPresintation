const PptxGenJS = require("pptxgenjs");
const { v4 } = require("uuid");
const path = require("path");
const { text } = require("stream/consumers");
const { bold } = require("telegraf/format");
let themes = [
  {
    backgroundColor: "#4A90E2",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#50E3C2",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#D0021B",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#F5A623",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#7ED321",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#9013FE",
    textColor: "#FFFFFF",
  },
  {
    backgroundColor: "#F8E71C",
    textColor: "#333333",
  },
  {
    backgroundColor: "#B8E986",
    textColor: "#333333",
  },
];

function createPresentation(slidesData, thema = 0) {
  // Создаем новую презентацию
  let pptx = new PptxGenJS();

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
    fontSize: 24,
    color: themes[thema].textColor,
    fill: { color: themes[thema].backgroundColor },
  });

  titleSlide.addImage({
    path: path.join(__dirname, "..", "pictures", "logo.jpg"), // Путь к изображению
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
        path: path.join(__dirname, "..", "pictures", slide.background), // Путь к фоновому изображению
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
        transparency: 50,
        fill: { color: themes[thema].backgroundColor, transparency: 50 }, // Черный цвет с 60% прозрачностью
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

    // Если есть изображение, добавляем его
    if (slide.image) {
      slideItem.addImage({
        path: path.join(__dirname, "..", "pictures", slide.image), // Путь к изображению
        x: "60%",
        y: "25%",
        w: 2.5,
        h: 2.5,
        align: "right",
      });
      slideItem.addText(slide.title, {
        x: 1,
        y: 1,
        fontSize: 20,
        color: themes[thema].textColor,
      });
      slideItem.addText(slide.text, {
        x: 1,
        y: 2.4,
        w: "40%",
        fontSize: 14,
        color: themes[thema].textColor,
      });
    } else {
      // Добавляем текст
      slideItem.addText(slide.title, {
        x: 1,
        y: 1,
        fontSize: 20,
        color: themes[thema].textColor,
      });
      slideItem.addText(slide.text, {
        x: 1,
        y: 2,
        fontSize: 14,
        color: themes[thema].textColor,
      });
    }
  });

  // Сохраняем презентацию в папку storage
  pptx
    .writeFile({
      fileName: path.join(__dirname, "..", "storage", `${v4()}.pptx`),
    })
    .catch((err) => {
      console.error("Ошибка при сохранении презентации:", err);
    });
}
const slidesData = {
  title:
    "Современные технологии в образовании: влияние, преимущества и перспективы",
  sliders: [
    {
      title: "Введение",
      text: "На пороге цифровой эпохи образовательный процесс претерпевает значительные изменения. Технологии открывают новые пути для обучения, делая его доступным и гибким. В этой презентации мы обсудим, как интернет, мобильные приложения и инновационные технологии, такие как искусственный интеллект, трансформируют образование. Понимание этих изменений помогает нам использовать их для лучшего восприятия знаний и повышения мотивации к обучению.",
    },
    {
      title: "Доступность образования через цифровые технологии",
      text: "С ростом интернета и мобильных технологий доступ к обучению стал возможен для огромного числа людей по всему миру. Онлайн-платформы, такие как Coursera и EdX, позволяют пройти курсы ведущих университетов, а вебинары и виртуальные классы — получить качественное образование даже в отдаленных регионах. Доступность материалов и взаимодействие с преподавателями способствуют тому, что студенты могут учиться в удобное для них время, не привязываясь к месту.",
    },
    {
      title: "Искусственный интеллект в образовании",
      text: "Искусственный интеллект (ИИ) активно внедряется в образовательный процесс и помогает персонализировать обучение. Примеры таких приложений, как 'Адаптивное обучение' от Knewton или аналитика Google Classroom, позволяют отслеживать прогресс учащихся, выявлять их сильные и слабые стороны и адаптировать материал к индивидуальным потребностям. ИИ также помогает сократить время на подготовку материалов и автоматизировать проверку домашних заданий.",
    },
    {
      title: "Виртуальная и дополненная реальность в обучении",
      text: "Технологии виртуальной (VR) и дополненной реальности (AR) создают уникальные возможности для вовлечения студентов в образовательный процесс. С помощью VR можно оказаться в исторических местах или на другой планете, а AR позволяет просматривать 3D-модели объектов и создавать интерактивные опыты. Например, такие приложения, как Google Expeditions, уже активно используются в школьной системе и позволяют делать уроки более наглядными и увлекательными.",
    },
    {
      title: "Образовательные мобильные приложения",
      text: "Смартфоны и планшеты стали важными инструментами для образования. Приложения, такие как Duolingo для изучения языков или Photomath для решения математических задач, делают обучение интересным и доступным. Виртуальные флеш-карты, такие как Quizlet, помогают запоминать информацию с помощью повторений. Эти инструменты превращают учебный процесс в интересное и интерактивное занятие, позволяя учиться в любое время и в любом месте.",
    },
    {
      title: "Онлайн-курсы и платформы для самообучения",
      image: `AgACAgIAAxkBAAIJBWcsIax9X-4RPWyPom-TrYgwtdZeAALk6TEbeWRhSWCKfVV_xKemAQADAgADeQADNgQ.jpg`,
      background: `AgACAgIAAxkBAAII1Gcqrv5SI7tVQjb73Y5nkArSkZPIAALj6TEbdJ9QSXRQ4duSJvl_AQADAgADeQADNgQ.jpg`,
      text: "Онлайн-курсы стали неотъемлемой частью образования. Платформы, такие как Coursera, Udacity и Khan Academy, предлагают широкий выбор курсов, доступных в любое время и подходящих для студентов с разными уровнями подготовки. Они позволяют студентам учиться в своем темпе, улучшать навыки и получать новые знания.",
    },
    {
      title: "Будущее образования",
      text: "С развитием технологий мы можем ожидать появления новых форматов обучения, таких как виртуальная и дополненная реальность, а также искусственный интеллект и анализ больших данных. Эти инновации не только помогут сделать обучение более доступным, но и откроют новые возможности для его персонализации, делая процесс обучения еще более эффективным и интересным.",
    },
    {
      title: "Заключение",
      text: "Современные технологии открывают новые возможности для образования, но также требуют от нас гибкости и готовности к переменам. Чтобы использовать весь их потенциал, нам необходимо следить за новыми разработками, совершенствовать навыки и адаптироваться к изменяющимся условиям. Лишь тогда мы сможем построить образовательную систему, которая будет соответствовать требованиям будущего.",
    },
  ],
};

// Создаем презентацию
createPresentation(slidesData, 5);
