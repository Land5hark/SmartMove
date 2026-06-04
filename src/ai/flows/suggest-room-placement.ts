'use server';

/**
 * @fileOverview Room suggestion AI agent.
 *
 * - suggestRoomPlacement - A function that suggests a room for a box based on its contents.
 * - SuggestRoomPlacementInput - The input type for the suggestRoomPlacement function.
 * - SuggestRoomPlacementOutput - The return type for the suggestRoomPlacement function.
 */

import { generateGeminiJson } from '@/ai/google-gemini';

export type SuggestRoomPlacementInput = {
  itemDescription: string;
};

export type SuggestRoomPlacementOutput = {
  suggestedRoom: string;
};

export async function suggestRoomPlacement(input: SuggestRoomPlacementInput): Promise<SuggestRoomPlacementOutput> {
  const result = await generateGeminiJson<{ suggestedRoom?: unknown }>({
    prompt: `Suggest the most appropriate room for these moving box contents. Return only JSON: {"suggestedRoom":"Kitchen"}.\n\nItems: ${input.itemDescription}`,
  });

  if (typeof result.suggestedRoom !== 'string' || !result.suggestedRoom.trim()) {
    throw new Error('AI room suggestion returned an empty response.');
  }

  return { suggestedRoom: result.suggestedRoom.trim() };
}
