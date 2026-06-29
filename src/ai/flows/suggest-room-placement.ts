"use server";

import { generateNimJson } from "@/ai/nvidia-nim";
import { DEFAULT_MODEL_ID, MODEL_COOKIE } from "@/ai/models";
import { cookies } from "next/headers";

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
  const jar = await cookies();
  const model = jar.get(MODEL_COOKIE)?.value || DEFAULT_MODEL_ID;

  const result = await generateNimJson<{ suggestedRoom: string }>({
    prompt: PROMPT(input.itemDescription),
    model,
  });

  return {
    suggestedRoom:
      typeof result.suggestedRoom === "string" ? result.suggestedRoom : "Unknown",
  };
}
