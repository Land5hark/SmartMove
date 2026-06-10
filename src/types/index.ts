export type ScanMode = "fast" | "balanced" | "high_accuracy";

export interface BoxItem {
  id: string;
  name: string;
  normalizedLabel?: string;
  count?: number;
  confidence?: "high" | "medium" | "low";
  category?: string;
  bboxHint?: string;
  attributes?: string[];
  notes?: string;
}

export interface ScanItem {
  label: string;
  normalized_label: string;
  count: number;
  confidence: "high" | "medium" | "low";
  bbox_hint: string;
  attributes: string[];
  notes: string;
}

export interface ScanResult {
  boxId?: string;
  scanStatus: "completed" | "failed" | "partial";
  modelUsed: string;
  needsReview: boolean;
  rawConfidenceSummary: {
    high: number;
    medium: number;
    low: number;
  };
  warnings: string[];
  items: ScanItem[];
}

export interface Box {
  id: string;
  qrCodeValue: string;
  userId?: string;
  photoDataUrl?: string; // ephemeral base64 — not persisted to DB
  photoUrl?: string; // Supabase Storage URL
  photoPath?: string; // Supabase Storage path (for deletion)
  items: BoxItem[];
  manualDescription?: string;
  aiGeneratedTags?: string[];
  suggestedRoom?: string;
  assignedRoom?: string;
  createdAt: string;
}

export const ROOM_OPTIONS = [
  "Kitchen",
  "Living Room",
  "Dining Room",
  "Master Bedroom",
  "Bedroom 2",
  "Bedroom 3",
  "Office",
  "Bathroom 1",
  "Bathroom 2",
  "Garage",
  "Basement",
  "Attic",
  "Storage",
  "Utility Room",
  "Playroom",
  "Guest Room",
] as const;

export type Room = (typeof ROOM_OPTIONS)[number];
