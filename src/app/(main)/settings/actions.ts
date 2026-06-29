"use server";

import { cookies } from "next/headers";
import { MODEL_COOKIE, AI_MODELS } from "@/ai/models";

export async function setModelPreference(modelId: string): Promise<void> {
  const valid = AI_MODELS.some((m) => m.id === modelId);
  if (!valid) throw new Error("Invalid model ID");

  const jar = await cookies();
  jar.set(MODEL_COOKIE, modelId, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}

export async function getModelPreference(): Promise<string> {
  const jar = await cookies();
  return jar.get(MODEL_COOKIE)?.value || AI_MODELS[0].id;
}
