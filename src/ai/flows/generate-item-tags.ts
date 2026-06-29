"use server";

import { generateNimJson } from "@/ai/nvidia-nim";
import { DEFAULT_MODEL_ID, MODEL_COOKIE } from "@/ai/models";
import { cookies } from "next/headers";

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
  const jar = await cookies();
  const model = jar.get(MODEL_COOKIE)?.value || DEFAULT_MODEL_ID;

  const result = await generateNimJson<{ itemTags: string[] }>({
    prompt: PROMPT,
    photoDataUri: input.photoDataUri,
    model,
  });

  return {
    itemTags: Array.isArray(result.itemTags) ? result.itemTags : [],
  };
}
