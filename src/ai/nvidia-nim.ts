const NVIDIA_NIM_BASE = "https://integrate.api.nvidia.com/v1";

type NimRequest = {
  prompt: string;
  photoDataUri?: string;
  model: string;
};

function getApiKey() {
  return process.env.NVIDIA_API_KEY;
}

function parseJsonResponse(text: string): unknown {
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const cleaned = withoutThink
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

export async function generateNimJson<T>({
  prompt,
  photoDataUri,
  model,
}: NimRequest): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured. Add it to your environment.");
  }

  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  if (photoDataUri) {
    content.push({ type: "image_url", image_url: { url: photoDataUri } });
  }

  const response = await fetch(`${NVIDIA_NIM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      max_tokens: 8192,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `NVIDIA NIM request failed (HTTP ${response.status}): ${errorBody}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("NVIDIA NIM returned an empty response.");
  }

  return parseJsonResponse(text) as T;
}
