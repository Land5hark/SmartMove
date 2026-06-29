export type AiModel = {
  id: string;
  name: string;
  description: string;
};

export const AI_MODELS: AiModel[] = [
  {
    id: "minimaxai/minimax-m3",
    name: "MiniMax M3",
    description: "MiniMax M3 — multimodal, fast vision identification",
  },
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    description: "Moonshot Kimi K2.6 — multimodal, strong instruction following",
  },
];

export const DEFAULT_MODEL_ID = AI_MODELS[0].id;

export const MODEL_COOKIE = "sm_ai_model";
