const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey:" process.env.OPENAI_API_KEY",
});
const { z } = require("zod");

// Модель Zod для валидации структуры JSON-ответа.
// Модель Zod для проверки структуры JSON-ответа от ChatGPT
const SlideItemSchema = z.object({
  title: z.string(),
  text: z.string(),
});

const PresentationSchema = z.object({
  title: z.string(),
  sliders: z.array(SlideItemSchema),
});
async function getJsonFromChatGpt(text) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Ты помощник, который возвращает текст в формате JSON-массива.",
        },
        {
          role: "user",
          content: `Создай короткие пункты для слайдов презентации ${text}, строго в виде массива строк в JSON, без всяких комментариев и пояснений. Только массив строк.`,
        },
      ],
      temperature: 0.5,
    });

    const validatedData = PresentationSchema.parse({
      title: text,
      sliders: JSON.parse(completion.choices[0].message.content),
    });

    // Если валидация прошла успешно, возвращаем данные
    return validatedData;
  } catch (error) {
    console.error("Ошибка при получении или валидации данных:", error);
    return null;
  }
}

let response = getJsonFromChatGpt("почему я какаю стоя");
console.log(response);
