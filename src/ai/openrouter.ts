const DEFAULT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

type OpenRouterRequest = {
  prompt: string;
  photoDataUri?: string;
  model?: string;
};

function getDefaultModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

function getApiKey() {
  return process.env.OPENROUTER_API_KEY;
}

function parseJsonResponse(text: string) {
  // Strip <think>...</think> blocks emitted by reasoning models
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const cleaned = withoutThink
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as unknown;
}

export async function generateOpenRouterJson<T>({
  prompt,
  photoDataUri,
  model,
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
      model: model || getDefaultModel(),
      messages: [{ role: "user", content }],
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
