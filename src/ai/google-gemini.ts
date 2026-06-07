const GEMINI_MODEL = "gemini-2.0-flash";

type GeminiJsonRequest = {
  prompt: string;
  photoDataUri?: string;
};

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENKIT_API_KEY
  );
}

function parseDataUri(dataUri: string) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Photo must be a base64 data URI.");
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function parseJsonResponse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as unknown;
}

export async function generateGeminiJson<T>({
  prompt,
  photoDataUri,
}: GeminiJsonRequest): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY.",
    );
  }

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (photoDataUri) {
    const photo = parseDataUri(photoDataUri);
    parts.push({
      inlineData: {
        mimeType: photo.mimeType,
        data: photo.data,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part.text === "string",
  )?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseJsonResponse(text) as T;
}
