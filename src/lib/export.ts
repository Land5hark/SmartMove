import { getSupabase } from "@/lib/supabase";
import type { Box } from "@/types";

const DOCUMENTS_BUCKET = "inventory-docs";

export interface InventoryDocument {
  id: string;
  title: string;
  boxCount: number;
  itemCount: number;
  createdAt: string;
  storagePath: string;
}

export function generateInventoryText(boxes: Box[]): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString();

  lines.push("=".repeat(50));
  lines.push("  SMARTMOVE - FULL INVENTORY REPORT");
  lines.push(`  Generated: ${date}`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Total Boxes: ${boxes.length}`);
  lines.push(
    `Total Items: ${boxes.reduce((s, b) => s + (b.items?.length || 0), 0)}`,
  );
  const rooms = new Set(boxes.map((b) => b.assignedRoom).filter(Boolean));
  lines.push(`Total Rooms: ${rooms.size}`);
  lines.push("");

  boxes.forEach((box, i) => {
    lines.push("-".repeat(40));
    lines.push(`Box #${i + 1}: ${box.id.substring(0, 8)}`);
    if (box.assignedRoom) lines.push(`  Room: ${box.assignedRoom}`);
    lines.push(`  Created: ${new Date(box.createdAt).toLocaleDateString()}`);
    if (box.manualDescription)
      lines.push(`  Notes: ${box.manualDescription}`);

    if (box.items && box.items.length > 0) {
      lines.push(`  Items (${box.items.length}):`);
      box.items.forEach((item) => {
        const count = item.count && item.count > 1 ? ` x${item.count}` : "";
        lines.push(`    - ${item.name}${count}`);
      });
    } else {
      lines.push("  Items: (none)");
    }
    lines.push("");
  });

  lines.push("=".repeat(50));
  lines.push("  End of Report");
  lines.push("=".repeat(50));

  return lines.join("\n");
}

export function generateInventoryCsv(boxes: Box[]): string {
  const rows: string[] = ["Box ID,Room,Item Name,Item Count,Created Date"];
  boxes.forEach((box) => {
    const room = box.assignedRoom || "";
    const created = new Date(box.createdAt).toLocaleDateString();
    if (box.items && box.items.length > 0) {
      box.items.forEach((item) => {
        const escaped = `"${item.name.replace(/"/g, '""')}"`;
        rows.push(`${box.id.substring(0, 8)},${room},${escaped},${item.count || 1},${created}`);
      });
    } else {
      rows.push(`${box.id.substring(0, 8)},${room},"(empty)",,${created}`);
    }
  });
  return rows.join("\n");
}

export function generateInventoryJson(boxes: Box[]): string {
  const summary = {
    generatedAt: new Date().toISOString(),
    totalBoxes: boxes.length,
    totalItems: boxes.reduce((s, b) => s + (b.items?.length || 0), 0),
    rooms: [...new Set(boxes.map((b) => b.assignedRoom).filter(Boolean))],
    boxes: boxes.map((b) => ({
      id: b.id.substring(0, 8),
      room: b.assignedRoom || null,
      createdAt: b.createdAt,
      items: (b.items || []).map((i) => ({
        name: i.name,
        count: i.count || 1,
        category: i.category || null,
      })),
    })),
  };
  return JSON.stringify(summary, null, 2);
}

export function downloadBlob(
  filename: string,
  content: string,
  mimeType = "text/plain",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareInventory(
  title: string,
  text: string,
  url?: string,
): Promise<void> {
  if (navigator.share) {
    await navigator.share({ title, text, url });
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

async function ensureDocumentsBucket(): Promise<void> {
  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === DOCUMENTS_BUCKET)) {
    await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: false,
    });
  }
}

async function getDocumentIndexPath(userId: string): Promise<InventoryDocument[]> {
  const supabase = getSupabase();
  const { data } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(`${userId}/_index.json`);
  if (!data) return [];
  try {
    const text = await data.text();
    return JSON.parse(text) as InventoryDocument[];
  } catch {
    return [];
  }
}

export async function saveDocument(
  userId: string,
  title: string,
  content: string,
  boxCount: number,
  itemCount: number,
): Promise<InventoryDocument> {
  await ensureDocumentsBucket();
  const supabase = getSupabase();
  const id = crypto.randomUUID();
  const storagePath = `${userId}/${id}.txt`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, content, {
      contentType: "text/plain",
      upsert: false,
    });
  if (uploadError) throw new Error(`Failed to save document: ${uploadError.message}`);

  const doc: InventoryDocument = {
    id,
    title,
    boxCount,
    itemCount,
    createdAt: new Date().toISOString(),
    storagePath,
  };

  const index = await getDocumentIndexPath(userId);
  index.push(doc);
  const { error: indexError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(`${userId}/_index.json`, JSON.stringify(index, null, 2), {
      contentType: "application/json",
      upsert: true,
    });
  if (indexError) throw new Error(`Failed to update index: ${indexError.message}`);

  return doc;
}

export async function listDocuments(userId: string): Promise<InventoryDocument[]> {
  try {
    return await getDocumentIndexPath(userId);
  } catch {
    return [];
  }
}

export async function getDocumentContent(storagePath: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);
  if (!data) return null;
  return data.text();
}

export async function getDocumentShareUrl(storagePath: string): Promise<string> {
  const supabase = getSupabase();
  const { data } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteDocument(
  userId: string,
  doc: InventoryDocument,
): Promise<void> {
  const supabase = getSupabase();
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storagePath]);

  const index = await getDocumentIndexPath(userId);
  const updated = index.filter((d) => d.id !== doc.id);
  await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(`${userId}/_index.json`, JSON.stringify(updated, null, 2), {
      contentType: "application/json",
      upsert: true,
    });
}
