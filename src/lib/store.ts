
'use client';

import type { Box } from '@/types';

const BOXES_STORAGE_KEY = 'moveassist_boxes';
const PHOTO_STORAGE_KEY_PREFIX = 'moveassist_photo_';

// Internal helper to get raw boxes array (might contain photos from old format)
function getRawBoxesFromStorage(): Box[] {
  if (typeof window === 'undefined') return [];
  const storedBoxes = localStorage.getItem(BOXES_STORAGE_KEY);
  return storedBoxes ? JSON.parse(storedBoxes) : [];
}

// Internal helper to save only box metadata array
function saveMetadataBoxesToStorage(boxes: Omit<Box, 'photoDataUrl' | 'items'>[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxes));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.error("LocalStorage quota exceeded while saving box metadata array. Critical error.", e);
      alert("Error: Could not save box data. Storage is full. Please try removing some older boxes or freeing up browser storage.");
    }
    throw e; // Re-throw to indicate failure
  }
}

function savePhotoToStorage(boxId: string, photoDataUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(PHOTO_STORAGE_KEY_PREFIX + boxId, photoDataUrl);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn(`localStorage quota exceeded when trying to save photo for box ${boxId}. Photo not saved.`);
      alert(`Warning: Could not save photo for box ${boxId} due to storage limits. The box details are saved without the photo.`);
    } else {
      console.error(`Error saving photo for box ${boxId}:`, e);
    }
    return false;
  }
}

function getPhotoFromStorage(boxId: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(PHOTO_STORAGE_KEY_PREFIX + boxId) || undefined;
}

function deletePhotoFromStorage(boxId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PHOTO_STORAGE_KEY_PREFIX + boxId);
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getBoxes(): Box[] {
  // Returns boxes WITH photoDataUrl for list views
  // This might be performance intensive if many boxes have large photos
  const metadataBoxes = getRawBoxesFromStorage().map(box => {
    const { photoDataUrl, ...rest } = box; // Strip photoDataUrl if present from old storage
    return rest;
  });

  return metadataBoxes.map(boxMeta => {
    const photoDataUrl = getPhotoFromStorage(boxMeta.id);
    return {
      ...boxMeta,
      photoDataUrl: photoDataUrl, // Add photoDataUrl if found
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBox(id: string): Box | undefined {
  const rawBoxes = getRawBoxesFromStorage();
  const boxMeta = rawBoxes.find(box => box.id === id);

  if (!boxMeta) {
    return undefined;
  }
  
  // Create a new object from metadata, then try to add photo
  const resultBox: Box = { ...boxMeta }; // Includes items, etc.
  delete resultBox.photoDataUrl; // Remove if it was from old raw storage format

  const photoDataUrl = getPhotoFromStorage(id);
  if (photoDataUrl) {
    resultBox.photoDataUrl = photoDataUrl;
  }
  return resultBox;
}

export function saveBox(boxData: Omit<Box, 'createdAt' | 'qrCodeValue'> & { id?: string }): Box {
  let allBoxesMeta = getRawBoxesFromStorage().map(b => {
    const { photoDataUrl, ...rest } = b; // Work with metadata only for the main array
    return rest;
  });
  const now = new Date().toISOString();
  
  const { photoDataUrl: newPhotoData, ...boxMetaContent } = boxData;

  let finalBoxMeta: Omit<Box, 'photoDataUrl'>;
  let finalBoxId: string;

  if (boxMetaContent.id) { // Existing box
    const index = allBoxesMeta.findIndex(b => b.id === boxMetaContent.id);
    finalBoxId = boxMetaContent.id;
    if (index !== -1) {
      // Preserve existing items if not overwritten by boxMetaContent
      const existingItems = allBoxesMeta[index].items || [];
      finalBoxMeta = { 
        ...allBoxesMeta[index], 
        ...boxMetaContent, 
        items: boxMetaContent.items || existingItems, // Ensure items are merged/preserved
        qrCodeValue: finalBoxId 
      };
      allBoxesMeta[index] = finalBoxMeta;
    } else { 
      finalBoxId = boxMetaContent.id || generateUniqueId(); // Use provided ID or generate if new scenario
      finalBoxMeta = { ...boxMetaContent, id: finalBoxId, qrCodeValue: finalBoxId, createdAt: now, items: boxMetaContent.items || [] };
      allBoxesMeta.push(finalBoxMeta);
    }
  } else { // New box
    finalBoxId = generateUniqueId();
    finalBoxMeta = { ...boxMetaContent, id: finalBoxId, qrCodeValue: finalBoxId, createdAt: now, items: boxMetaContent.items || [] };
    allBoxesMeta.push(finalBoxMeta);
  }
  
  saveMetadataBoxesToStorage(allBoxesMeta.map(b => {
    // Ensure we are only saving metadata properties
    const { photoDataUrl, ...metaOnly } = b as any;
    return metaOnly;
  }));

  let photoActuallySaved = false;
  if (newPhotoData && finalBoxId) {
    photoActuallySaved = savePhotoToStorage(finalBoxId, newPhotoData);
  } else if (!newPhotoData && finalBoxId) {
    // If newPhotoData is explicitly null/undefined, means photo should be removed
    deletePhotoFromStorage(finalBoxId);
    photoActuallySaved = true; // Consider deletion a "successful" update regarding the photo attribute
  }

  // Construct the full box object to return
  const returnedBox: Box = { ...finalBoxMeta }; 
  if (photoActuallySaved && newPhotoData) {
    returnedBox.photoDataUrl = newPhotoData;
  }
  // If photo was meant to be deleted or failed to save, returnedBox.photoDataUrl will be undefined.

  return returnedBox;
}

export function deleteBox(id: string): void {
  let allBoxesMeta = getRawBoxesFromStorage().map(b => {
    const { photoDataUrl, ...rest } = b;
    return rest;
  });
  allBoxesMeta = allBoxesMeta.filter(box => box.id !== id);
  saveMetadataBoxesToStorage(allBoxesMeta);
  deletePhotoFromStorage(id); // Also delete associated photo
}
