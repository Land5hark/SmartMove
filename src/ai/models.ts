export type AiModel = {
  id: string;
  name: string;
  description: string;
};

export const AI_MODELS: AiModel[] = [
  {
    id: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    name: "Nemotron Ultra",
    description: "NVIDIA Nemotron 253B — best reasoning & accuracy",
  },
  {
    id: "minimax/minimax-text-01",
    name: "MiniMax 3",
    description: "MiniMax 456B — ultra-long context, fast",
  },
  {
    id: "moonshot/kimi-k2-instruct",
    name: "Kimi K2",
    description: "Moonshot Kimi K2 — 1T MoE, strong instruction following",
  },
];

export const DEFAULT_MODEL_ID = AI_MODELS[0].id;

export const MODEL_COOKIE = "sm_ai_model";
