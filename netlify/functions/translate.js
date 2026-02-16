const LANG_MAP = {
  de: "German",
  en: "English",
  sw: "Swahili",
  fr: "French",
  tr: "Turkish",
  ar: "Arabic",
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { text, fromLang, toLang } = body;

  if (!text || !fromLang || !toLang) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required fields: text, fromLang, toLang" }),
    };
  }

  if (!LANG_MAP[fromLang] || !LANG_MAP[toLang]) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unsupported language code. Supported: ${Object.keys(LANG_MAP).join(", ")}` }),
    };
  }

  if (fromLang === toLang) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ translated: text }),
    };
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Translation service not configured" }),
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: `You are a translator for a children's chat room (ages 11-15). Translate from ${LANG_MAP[fromLang]} to ${LANG_MAP[toLang]}. Return ONLY the translated text, nothing else. No quotes, no explanation. Keep it simple and age-appropriate. Keep emoji as-is.`,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[translate] Claude API error:", response.status, err);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Translation failed" }),
      };
    }

    const data = await response.json();
    const translated = data.content?.[0]?.text || "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ translated }),
    };
  } catch (err) {
    console.error("[translate] Request error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Translation service unavailable" }),
    };
  }
};
