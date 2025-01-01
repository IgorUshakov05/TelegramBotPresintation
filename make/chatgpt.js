const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");

const genAI = new GoogleGenerativeAI(process.env.genAI);

// Модель Zod для валидации структуры JSON-ответа
const SlideItemSchema = z.object({
  title: z.string(),
  text: z.string(),
});

const PresentationSchema = z.object({
  title: z.string(),
  sliders: z.array(SlideItemSchema),
});

async function generatePresentation(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Сгенерируй JSON для презентации по следующей теме: "${prompt},количество слово символов на каждом слайде должно быть около 400. слайдов не более 7. 
              Формат JSON:
              {
                "title": "Название презентации",
                "sliders": [
                  {
                    "title": "Заголовок слайда",
                    "text": "Текст слайда"
                  },
                ]
              }`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    const result = await chat.sendMessage("");
    const response = result.response.text();

    let parsedResponse;
    parsedResponse = response.slice(
      response.indexOf("{"),
      response.lastIndexOf("}") + 1
    );

    const validatedResponse = JSON.parse(parsedResponse);
    return validatedResponse;
  } catch (error) {
    console.error("Ошибка при генерации или валидации:", error);
    return {
      error: "Не удалось создать презентацию. Проверьте входные данные.",
    };
  }
}

// generatePresentation("Наряды 19 века в россии");

module.exports = { generatePresentation };
