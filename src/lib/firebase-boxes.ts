import { createBoxDraft, sanitizeBoxRecord } from "@/lib/box-model";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import type { Box } from "@/types";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadString,
} from "firebase/storage";

const BOXES_COLLECTION = "boxes";

function boxesCollection() {
  return collection(getFirebaseDb(), BOXES_COLLECTION);
}

function storagePath(userId: string, boxId: string) {
  return `users/${userId}/boxes/${boxId}/photo.jpg`;
}

async function uploadPhoto(
  userId: string,
  boxId: string,
  photoDataUrl?: string,
) {
  if (!photoDataUrl) return {};

  const path = storagePath(userId, boxId);
  const photoRef = ref(getFirebaseStorage(), path);
  await uploadString(photoRef, photoDataUrl, "data_url");

  return {
    photoPath: path,
    photoUrl: await getDownloadURL(photoRef),
  };
}

export async function listBoxes(userId: string): Promise<Box[]> {
  const snapshot = await getDocs(
    query(
      boxesCollection(),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ),
  );

  return snapshot.docs.map((boxDoc) =>
    sanitizeBoxRecord(boxDoc.id, boxDoc.data()),
  );
}

export async function getBox(
  userId: string,
  boxId: string,
): Promise<Box | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), BOXES_COLLECTION, boxId));
  if (!snapshot.exists()) return null;

  const box = sanitizeBoxRecord(snapshot.id, snapshot.data());
  return box.userId === userId ? box : null;
}

export async function saveBox(
  userId: string,
  input: Partial<Box> & Pick<Box, "id">,
): Promise<Box> {
  const existing = await getBox(userId, input.id);
  const uploadedPhoto = await uploadPhoto(userId, input.id, input.photoDataUrl);
  const box = createBoxDraft({
    ...existing,
    ...input,
    ...uploadedPhoto,
    id: input.id,
    userId,
    createdAt: existing?.createdAt,
  });

  await setDoc(doc(getFirebaseDb(), BOXES_COLLECTION, box.id), box);
  return box;
}

export async function importLegacyBox(
  userId: string,
  legacyBox: Box,
): Promise<Box> {
  const id = legacyBox.id || doc(boxesCollection()).id;
  return saveBox(userId, { ...legacyBox, id });
}

export async function createBox(
  userId: string,
  input: Omit<Partial<Box>, "id">,
): Promise<Box> {
  const documentRef = await addDoc(boxesCollection(), {
    userId,
    createdAt: new Date().toISOString(),
  });
  return saveBox(userId, { ...input, id: documentRef.id });
}

export async function deleteBox(userId: string, boxId: string): Promise<void> {
  const box = await getBox(userId, boxId);
  if (!box) return;

  await deleteDoc(doc(getFirebaseDb(), BOXES_COLLECTION, boxId));

  if (box.photoPath) {
    await deleteObject(ref(getFirebaseStorage(), box.photoPath)).catch(
      () => undefined,
    );
  }
}
