"use server";

import { generateOpenRouterJson } from "@/ai/openrouter";

export type SuggestRoomPlacementInput = {
  itemDescription: string;
};

export type SuggestRoomPlacementOutput = {
  suggestedRoom: string;
};

const PROMPT = (items: string) =>
  `You are an AI assistant that suggests the most appropriate room in a house for a box of items.

Suggest a single room name and nothing else. For example: "Kitchen" or "Bedroom 2".

Return a JSON object: {"suggestedRoom": "<room name>"}

Items: ${items}`;

export async function suggestRoomPlacement(
  input: SuggestRoomPlacementInput,
): Promise<SuggestRoomPlacementOutput> {
  const result = await generateOpenRouterJson<{ suggestedRoom: string }>({
    prompt: PROMPT(input.itemDescription),
  });

  return {
    suggestedRoom:
      typeof result.suggestedRoom === "string" ? result.suggestedRoom : "Unknown",
  };
}
