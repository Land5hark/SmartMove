'use server';

/**
 * @fileOverview AI-powered item tag generator for moving box contents.
 *
 * - generateItemTags - A function that handles the item tagging process.
 * - GenerateItemTagsInput - The input type for the generateItemTags function.
 * - GenerateItemTagsOutput - The return type for the generateItemTags function.
 */

import { generateGeminiJson } from '@/ai/google-gemini';

export type GenerateItemTagsInput = {
  photoDataUri: string;
};

export type GenerateItemTagsOutput = {
  itemTags: string[];
};

export async function generateItemTags(input: GenerateItemTagsInput): Promise<GenerateItemTagsOutput> {
  const result = await generateGeminiJson<{ itemTags?: unknown }>({
    prompt: 'Identify the visible items in this moving box photo. Return only JSON: {"itemTags":["books","lamp"]}. Use short lowercase tags.',
    photoDataUri: input.photoDataUri,
  });
  const itemTags = Array.isArray(result.itemTags)
    ? result.itemTags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];

  if (itemTags.length === 0) {
    throw new Error('AI tagging returned an empty response.');
  }

  return { itemTags };
}
