"use server";

import { generateOpenRouterJson } from "@/ai/openrouter";
import type { ScanItem, ScanMode, ScanResult } from "@/types";

type IdentifyBoxItemsInput = {
  photoDataUri: string;
  boxId?: string;
  scanMode?: ScanMode;
};

function getPrimaryModel(): string {
  return (
    process.env.OPENROUTER_PRIMARY_MODEL ||
    "google/gemini-3.1-pro-preview"
  );
}

function getFallbackModel(): string {
  return process.env.OPENROUTER_FALLBACK_MODEL || "openai/gpt-5.5";
}

const SCAN_PROMPT = `Identify every distinct visible item in this photo of a packing box.
Return JSON only.
Do not summarize the scene.
Enumerate objects individually.
If objects overlap, list them separately when they are likely separate items.
If uncertain, use low confidence instead of guessing.
For each item return:
- label (human-readable item name)
- normalized_label (canonical storage name)
- count (estimated quantity of that item)
- confidence (high, medium, or low)
- bbox_hint (rough position: top-left, top-right, center, bottom-left, bottom-right)
- attributes (array of visible properties like color, material, form factor)
- notes (explanation for ambiguity, or empty string)

Return this JSON structure:
{
  "items": [...],
  "warnings": ["string"],
  "needs_review": true
}`;

const VERIFICATION_PROMPT = `Review the following list of items identified in a packing box photo.
Check for duplicates, missing items, or generic descriptions.
Return the corrected item list with the same JSON structure.
Items must be individually enumerated with label, normalized_label, count, confidence, bbox_hint, attributes, notes.`;

function normalizeLabel(label: string): string {
  const lower = label.toLowerCase().trim();

  if (
    lower.includes("usb") ||
    lower.includes("charging cable") ||
    lower.includes("cord")
  ) {
    if (lower.includes("usb") || lower.includes("charging")) return "usb_cable";
    return "cable";
  }

  if (
    lower.includes("power") &&
    (lower.includes("adapter") || lower.includes("brick"))
  ) {
    return "power_adapter";
  }

  if (lower.includes("shirt") || lower === "t-shirt") return "shirt";
  if (lower.includes("book") || lower.includes("textbook")) return "book";
  if (lower.includes("lamp")) return "lamp";
  if (lower.includes("frame") || lower.includes("picture frame")) return "picture_frame";
  if (lower.includes("charger")) return "charger";

  return lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "unknown";
}

function shouldEscalate(
  items: ScanItem[],
  warnings: string[],
  mode: ScanMode,
): boolean {
  if (mode === "high_accuracy") return true;

  if (items.length === 0) return true;

  const lowConfidence = items.filter((i) => i.confidence === "low");
  if (lowConfidence.length > items.length / 2) return true;

  if (items.length < 2) return true;

  if (
    warnings.some((w) => w.toLowerCase().includes("generic") || w.toLowerCase().includes("overlap"))
  ) {
    return true;
  }

  return false;
}

export async function identifyBoxItems(
  input: IdentifyBoxItemsInput,
): Promise<ScanResult> {
  const { photoDataUri, boxId, scanMode = "balanced" } = input;

  const tryModel = async (
    model: string,
    prompt: string,
  ): Promise<{
    items: ScanItem[];
    warnings: string[];
    needsReview: boolean;
  } | null> => {
    try {
      const raw = await generateOpenRouterJson<{
        items?: ScanItem[];
        warnings?: string[];
        needs_review?: boolean;
      }>({
        prompt,
        photoDataUri,
        model,
      });

      if (!raw || !Array.isArray(raw.items)) return null;

      const validated: ScanItem[] = raw.items.filter((item: unknown) => {
        const i = item as Record<string, unknown>;
        return (
          typeof i?.label === "string" &&
          typeof i?.normalized_label === "string" &&
          typeof i?.count === "number" &&
          ["high", "medium", "low"].includes(i?.confidence as string) &&
          typeof i?.bbox_hint === "string" &&
          Array.isArray(i?.attributes) &&
          typeof i?.notes === "string"
        );
      });

      if (validated.length === 0 && raw.items && raw.items.length > 0) {
        return null;
      }

      return {
        items: validated,
        warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
        needsReview: raw.needs_review === true,
      };
    } catch {
      return null;
    }
  };

  let result = await tryModel(getPrimaryModel(), SCAN_PROMPT);

  let modelUsed = getPrimaryModel();

  if (!result || shouldEscalate(result.items, result.warnings, scanMode)) {
    const fallbackResult = await tryModel(getFallbackModel(), VERIFICATION_PROMPT);

    if (fallbackResult && fallbackResult.items.length > 0) {
      result = fallbackResult;
      modelUsed = getFallbackModel();
    }
  }

  if (!result) {
    return {
      boxId: boxId || "",
      scanStatus: "failed",
      modelUsed,
      needsReview: true,
      rawConfidenceSummary: { high: 0, medium: 0, low: 0 },
      warnings: [
        "AI scan failed to produce usable results.",
        "Please add items manually.",
      ],
      items: [],
    };
  }

  const itemsWithNormalized = result.items.map((item) => ({
    ...item,
    normalized_label: normalizeLabel(item.label),
  }));

  const confidenceSummary = {
    high: itemsWithNormalized.filter((i) => i.confidence === "high").length,
    medium: itemsWithNormalized.filter((i) => i.confidence === "medium").length,
    low: itemsWithNormalized.filter((i) => i.confidence === "low").length,
  };

  return {
    boxId: boxId || "",
    scanStatus: itemsWithNormalized.length > 0 ? "completed" : "partial",
    modelUsed,
    needsReview:
      result.needsReview ||
      confidenceSummary.low > 0 ||
      itemsWithNormalized.length < 2,
    rawConfidenceSummary: confidenceSummary,
    warnings: result.warnings,
    items: itemsWithNormalized,
  };
}
