import Groq from "groq-sdk";

// SDKs need Node APIs; never cache a translation response.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Small, fast, production model on Groq. `gemma-7b-it` (used previously) was
// decommissioned in Dec 2024. See https://console.groq.com/docs/models
const TRANSLATION_MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT =
  "You are a translation engine. Translate the user's text to English. " +
  "Reply with the translation only — no explanations, quotes, or extra text.";

export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let text;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim() === "") {
    return Response.json(
      { error: "`text` must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_completion_tokens: 256,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();
    if (!translatedText) {
      return Response.json({ error: "Empty translation" }, { status: 502 });
    }

    return Response.json({ translatedText });
  } catch (error) {
    console.error("Translation failed:", error);
    return Response.json({ error: "Translation failed" }, { status: 502 });
  }
}
