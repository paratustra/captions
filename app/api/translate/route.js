const Groq = require("groq-sdk");
import { GROQ_API_KEY } from "@/server.config";

export async function POST(request) {
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const { text } = await request.json();
  console.log("Text to translate: " + text);

  try {
    const translatedText = await translateText(text, groq);

    return new Response(JSON.stringify({ translatedText }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error translating text:", error);
    return new Response("Error translating text", { status: 500 });
  }
}

async function translateText(text, groq) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Translate the received text to English. DO NOT reply anything else but the text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "gemma-7b-it",
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || "Translation failed";
  } catch (error) {
    console.error("Error in translateText:", error);
    throw error;
  }
}
