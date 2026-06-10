import { getSupabase } from "@/lib/supabase";
import type { Box, BoxItem } from "@/types";

const BUCKET = "box-photos";

type BoxRow = {
  id: string;
  user_id: string;
  manual_description: string | null;
  ai_generated_tags: string[] | null;
  suggested_room: string | null;
  assigned_room: string | null;
  photo_path: string | null;
  photo_url: string | null;
  items: BoxItem[] | null;
  created_at: string;
};

function rowToBox(row: BoxRow): Box {
  return {
    id: row.id,
    userId: row.user_id,
    qrCodeValue: row.id,
    manualDescription: row.manual_description ?? undefined,
    aiGeneratedTags: row.ai_generated_tags ?? [],
    suggestedRoom: row.suggested_room ?? undefined,
    assignedRoom: row.assigned_room ?? undefined,
    photoPath: row.photo_path ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    items: row.items ?? [],
    createdAt: row.created_at,
  };
}

async function uploadPhoto(
  userId: string,
  boxId: string,
  photoDataUrl: string,
): Promise<{ photoPath: string; photoUrl: string } | null> {
  const base64 = photoDataUrl.split(",")[1];
  const mime = photoDataUrl.split(";")[0].split(":")[1] || "image/jpeg";
  const ext = mime === "image/png" ? "png" : "jpg";
  const path = `${userId}/${boxId}/photo.${ext}`;

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data: urlData } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return { photoPath: path, photoUrl: urlData.publicUrl };
}

async function deletePhoto(photoPath: string): Promise<void> {
  await getSupabase().storage.from(BUCKET).remove([photoPath]);
}

export async function listBoxes(userId: string): Promise<Box[]> {
  const { data, error } = await getSupabase()
    .from("boxes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as BoxRow[]).map(rowToBox);
}

export async function getBox(
  userId: string,
  boxId: string,
): Promise<Box | null> {
  const { data, error } = await getSupabase()
    .from("boxes")
    .select("*")
    .eq("id", boxId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToBox(data as BoxRow);
}

export async function saveBox(
  userId: string,
  input: Partial<Box> & Pick<Box, "id">,
): Promise<Box> {
  let photoPath = input.photoPath;
  let photoUrl = input.photoUrl;

  if (input.photoDataUrl) {
    const uploaded = await uploadPhoto(userId, input.id, input.photoDataUrl);
    if (uploaded) {
      photoPath = uploaded.photoPath;
      photoUrl = uploaded.photoUrl;
    }
  }

  const row = {
    id: input.id,
    user_id: userId,
    manual_description: input.manualDescription ?? null,
    ai_generated_tags: input.aiGeneratedTags ?? [],
    suggested_room: input.suggestedRoom ?? null,
    assigned_room: input.assignedRoom ?? null,
    photo_path: photoPath ?? null,
    photo_url: photoUrl ?? null,
    items: input.items ?? [],
    created_at: input.createdAt ?? new Date().toISOString(),
  };

  const { data, error } = await getSupabase()
    .from("boxes")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToBox(data as BoxRow);
}

export async function deleteBox(userId: string, boxId: string): Promise<void> {
  const box = await getBox(userId, boxId);

  const { error } = await getSupabase()
    .from("boxes")
    .delete()
    .eq("id", boxId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  if (box?.photoPath) {
    await deletePhoto(box.photoPath).catch(() => undefined);
  }
}

export function generateBoxId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
