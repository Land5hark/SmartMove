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
  photo_path: string | null;       // legacy thumbnail path
  photo_url: string | null;        // legacy thumbnail URL
  photo_urls: string[] | null;     // all stored URLs
  photo_paths: string[] | null;    // all stored paths (parallel to photo_urls)
  thumbnail_index: number | null;
  items: BoxItem[] | null;
  created_at: string;
};

function rowToBox(row: BoxRow): Box {
  const photoUrls =
    row.photo_urls && row.photo_urls.length > 0
      ? row.photo_urls
      : row.photo_url
        ? [row.photo_url]
        : [];
  const photoPaths =
    row.photo_paths && row.photo_paths.length > 0
      ? row.photo_paths
      : row.photo_path
        ? [row.photo_path]
        : [];
  const thumbnailIndex = Math.min(
    row.thumbnail_index ?? 0,
    Math.max(0, photoUrls.length - 1),
  );

  return {
    id: row.id,
    userId: row.user_id,
    qrCodeValue: row.id,
    manualDescription: row.manual_description ?? undefined,
    aiGeneratedTags: row.ai_generated_tags ?? [],
    suggestedRoom: row.suggested_room ?? undefined,
    assignedRoom: row.assigned_room ?? undefined,
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    photoPaths: photoPaths.length > 0 ? photoPaths : undefined,
    thumbnailIndex: photoUrls.length > 0 ? thumbnailIndex : undefined,
    photoUrl: photoUrls[thumbnailIndex] ?? undefined,
    photoPath: photoPaths[thumbnailIndex] ?? undefined,
    items: row.items ?? [],
    createdAt: row.created_at,
  };
}

async function uploadPhoto(
  userId: string,
  boxId: string,
  photoDataUrl: string,
  suffix?: string,
): Promise<{ photoPath: string; photoUrl: string } | null> {
  const base64 = photoDataUrl.split(",")[1];
  const mime = photoDataUrl.split(";")[0].split(":")[1] || "image/jpeg";
  const ext = mime === "image/png" ? "png" : "jpg";
  const filename = suffix ? `photo_${suffix}.${ext}` : `photo.${ext}`;
  const path = `${userId}/${boxId}/${filename}`;

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data: urlData } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return { photoPath: path, photoUrl: urlData.publicUrl };
}

async function deletePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await getSupabase().storage.from(BUCKET).remove(paths);
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

export async function getBoxPublic(boxId: string): Promise<Box | null> {
  const { data, error } = await getSupabase()
    .from("boxes")
    .select("*")
    .eq("id", boxId)
    .single();

  if (error || !data) return null;
  return rowToBox(data as BoxRow);
}

export async function saveBox(
  userId: string,
  input: Partial<Box> & Pick<Box, "id">,
): Promise<Box> {
  // Already-uploaded photos to keep (http/https URLs)
  const keptUrls = input.photoUrls ?? (input.photoUrl ? [input.photoUrl] : []);
  const keptPaths = input.photoPaths ?? (input.photoPath ? [input.photoPath] : []);

  // New data-URI photos to upload
  const newDataUris: string[] = [
    ...(input.photoDataUrl ? [input.photoDataUrl] : []),
    ...(input.photoDataUrls ?? []),
  ];

  const newUploads: Array<{ photoPath: string; photoUrl: string }> = [];
  for (let i = 0; i < newDataUris.length; i++) {
    const suffix = `${Date.now().toString(36)}_${i}`;
    const uploaded = await uploadPhoto(userId, input.id, newDataUris[i], suffix);
    if (uploaded) newUploads.push(uploaded);
  }

  const allUrls = [...keptUrls, ...newUploads.map((u) => u.photoUrl)];
  const allPaths = [...keptPaths, ...newUploads.map((u) => u.photoPath)];
  const thumbnailIdx =
    input.thumbnailIndex !== undefined
      ? Math.min(input.thumbnailIndex, Math.max(0, allUrls.length - 1))
      : 0;

  const row = {
    id: input.id,
    user_id: userId,
    manual_description: input.manualDescription ?? null,
    ai_generated_tags: input.aiGeneratedTags ?? [],
    suggested_room: input.suggestedRoom ?? null,
    assigned_room: input.assignedRoom ?? null,
    photo_url: allUrls[thumbnailIdx] ?? null,
    photo_path: allPaths[thumbnailIdx] ?? null,
    photo_urls: allUrls.length > 0 ? allUrls : null,
    photo_paths: allPaths.length > 0 ? allPaths : null,
    thumbnail_index: allUrls.length > 0 ? thumbnailIdx : null,
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

  const paths = box?.photoPaths ?? (box?.photoPath ? [box.photoPath] : []);
  await deletePhotos(paths).catch(() => undefined);
}

export function generateBoxId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
