import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Box } from '../types';
import { getFirebaseDb, getFirebaseStorage } from './firebase';

const COLLECTION = 'boxes';

function sanitize(id: string, value: Record<string, unknown>): Box {
  return {
    id,
    userId: String(value.userId || ''),
    qrCodeValue: String(value.qrCodeValue || id),
    photoUrl: typeof value.photoUrl === 'string' ? value.photoUrl : undefined,
    photoPath: typeof value.photoPath === 'string' ? value.photoPath : undefined,
    items: Array.isArray(value.items) ? value.items as Box['items'] : [],
    manualDescription: typeof value.manualDescription === 'string' ? value.manualDescription : undefined,
    aiGeneratedTags: Array.isArray(value.aiGeneratedTags) ? value.aiGeneratedTags.filter((tag): tag is string => typeof tag === 'string') : [],
    suggestedRoom: typeof value.suggestedRoom === 'string' ? value.suggestedRoom : undefined,
    assignedRoom: typeof value.assignedRoom === 'string' ? value.assignedRoom : undefined,
    createdAt: String(value.createdAt || new Date().toISOString()),
  };
}

async function uploadPhoto(userId: string, boxId: string, uri?: string) {
  if (!uri) return {};

  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `users/${userId}/boxes/${boxId}/photo.jpg`;
  const photoRef = ref(getFirebaseStorage(), path);
  await uploadBytes(photoRef, blob);
  return { photoPath: path, photoUrl: await getDownloadURL(photoRef) };
}

export async function listBoxes(userId: string) {
  const snapshot = await getDocs(query(
    collection(getFirebaseDb(), COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  ));

  return snapshot.docs.map(boxDoc => sanitize(boxDoc.id, boxDoc.data()));
}

export async function getBox(userId: string, boxId: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTION, boxId));
  if (!snapshot.exists()) return null;

  const box = sanitize(snapshot.id, snapshot.data());
  return box.userId === userId ? box : null;
}

export async function saveBox(userId: string, input: {
  id: string;
  manualDescription?: string;
  assignedRoom?: string;
  photoUri?: string;
}) {
  const existing = await getBox(userId, input.id);
  const uploadedPhoto = await uploadPhoto(userId, input.id, input.photoUri);
  const box: Box = {
    id: input.id,
    userId,
    qrCodeValue: input.id,
    createdAt: existing?.createdAt || new Date().toISOString(),
    items: existing?.items || [],
    aiGeneratedTags: existing?.aiGeneratedTags || [],
    suggestedRoom: existing?.suggestedRoom,
    manualDescription: input.manualDescription,
    assignedRoom: input.assignedRoom,
    photoPath: uploadedPhoto.photoPath || existing?.photoPath,
    photoUrl: uploadedPhoto.photoUrl || existing?.photoUrl,
  };

  await setDoc(doc(getFirebaseDb(), COLLECTION, box.id), box);
  return box;
}

export async function deleteBox(userId: string, boxId: string) {
  const box = await getBox(userId, boxId);
  if (!box) return;

  await deleteDoc(doc(getFirebaseDb(), COLLECTION, boxId));
  if (box.photoPath) {
    await deleteObject(ref(getFirebaseStorage(), box.photoPath)).catch(() => undefined);
  }
}

export function boxUrl(boxId: string) {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:9002';
  return `${baseUrl.replace(/\/+$/, '')}/box/${encodeURIComponent(boxId)}`;
}
