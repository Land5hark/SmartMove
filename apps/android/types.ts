export type BoxItem = {
  id: string;
  name: string;
  category?: string;
};

export type Box = {
  id: string;
  userId: string;
  qrCodeValue: string;
  photoUrl?: string;
  photoPath?: string;
  items: BoxItem[];
  manualDescription?: string;
  aiGeneratedTags?: string[];
  suggestedRoom?: string;
  assignedRoom?: string;
  createdAt: string;
};

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
