"use server";

import { generateOpenRouterJson } from "@/ai/openrouter";

export type GenerateItemTagsInput = {
  photoDataUri: string;
};

export type GenerateItemTagsOutput = {
  itemTags: string[];
};

const PROMPT = `You are an expert moving assistant. Identify and tag the individual items visible in this photo of a moving box.

Return a JSON object with a single key "itemTags" containing an array of string labels.
Example: {"itemTags": ["books", "picture frames", "lamp"]}`;

export async function generateItemTags(
  input: GenerateItemTagsInput,
): Promise<GenerateItemTagsOutput> {
  const result = await generateOpenRouterJson<{ itemTags: string[] }>({
    prompt: PROMPT,
    photoDataUri: input.photoDataUri,
  });

  return {
    itemTags: Array.isArray(result.itemTags) ? result.itemTags : [],
  };
}
