import type { Box, BoxItem } from "@/types";

type BoxInput = Partial<Box> & Pick<Box, "id"> & { userId: string };

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function boxItems(value: unknown): BoxItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BoxItem => {
    return Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as BoxItem).id === "string" &&
      typeof (item as BoxItem).name === "string",
    );
  });
}

export function createBoxDraft(input: BoxInput): Box {
  const { photoDataUrl: _photoDataUrl, ...rest } = input;

  return {
    ...rest,
    id: input.id,
    userId: input.userId,
    qrCodeValue: input.qrCodeValue || input.id,
    createdAt: input.createdAt || new Date().toISOString(),
    items: input.items || [],
    aiGeneratedTags: input.aiGeneratedTags || [],
  };
}

export function sanitizeBoxRecord(id: string, value: unknown): Box {
  const record =
    value && typeof value === "object" ? (value as Partial<Box>) : {};

  return {
    id,
    userId: typeof record.userId === "string" ? record.userId : undefined,
    qrCodeValue: record.qrCodeValue || id,
    photoUrl: typeof record.photoUrl === "string" ? record.photoUrl : undefined,
    photoPath:
      typeof record.photoPath === "string" ? record.photoPath : undefined,
    items: boxItems(record.items),
    manualDescription:
      typeof record.manualDescription === "string"
        ? record.manualDescription
        : undefined,
    aiGeneratedTags: stringArray(record.aiGeneratedTags),
    suggestedRoom:
      typeof record.suggestedRoom === "string"
        ? record.suggestedRoom
        : undefined,
    assignedRoom:
      typeof record.assignedRoom === "string" ? record.assignedRoom : undefined,
    createdAt: record.createdAt || new Date().toISOString(),
  };
}
