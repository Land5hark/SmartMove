const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

type OpenRouterRequest = {
  prompt: string;
  photoDataUri?: string;
};

function getModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

function getApiKey() {
  return process.env.OPENROUTER_API_KEY;
}

function parseJsonResponse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as unknown;
}

export async function generateOpenRouterJson<T>({
  prompt,
  photoDataUri,
}: OpenRouterRequest): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Set OPENROUTER_API_KEY.",
    );
  }

  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  if (photoDataUri) {
    content.push({ type: "image_url", image_url: { url: photoDataUri } });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed with HTTP ${response.status}: ${errorBody}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return parseJsonResponse(text) as T;
}
