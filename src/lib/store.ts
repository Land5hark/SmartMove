'use client';

import type { Box } from '@/types';

const BOXES_STORAGE_KEY = 'moveassist_boxes';

function getBoxesFromStorage(): Box[] {
  if (typeof window === 'undefined') return [];
  const storedBoxes = localStorage.getItem(BOXES_STORAGE_KEY);
  return storedBoxes ? JSON.parse(storedBoxes) : [];
}

function saveBoxesToStorage(boxes: Box[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxes));
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getBoxes(): Box[] {
  return getBoxesFromStorage().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBox(id: string): Box | undefined {
  const boxes = getBoxesFromStorage();
  return boxes.find(box => box.id === id);
}

export function saveBox(boxData: Omit<Box, 'createdAt' | 'qrCodeValue'> & { id?: string }): Box {
  const boxes = getBoxesFromStorage();
  const now = new Date().toISOString();
  
  let newOrUpdatedBox: Box;

  if (boxData.id) {
    // Update existing box
    const index = boxes.findIndex(b => b.id === boxData.id);
    if (index !== -1) {
      newOrUpdatedBox = { ...boxes[index], ...boxData, qrCodeValue: boxData.id };
      boxes[index] = newOrUpdatedBox;
    } else {
      // If ID provided but not found, treat as new (should ideally not happen with proper flow)
      const newId = boxData.id || generateUniqueId();
      newOrUpdatedBox = { ...boxData, id: newId, qrCodeValue: newId, createdAt: now };
      boxes.push(newOrUpdatedBox);
    }
  } else {
    // Create new box
    const newId = generateUniqueId();
    newOrUpdatedBox = { ...boxData, id: newId, qrCodeValue: newId, createdAt: now };
    boxes.push(newOrUpdatedBox);
  }
  
  saveBoxesToStorage(boxes);
  return newOrUpdatedBox;
}

export function deleteBox(id: string): void {
  let boxes = getBoxesFromStorage();
  boxes = boxes.filter(box => box.id !== id);
  saveBoxesToStorage(boxes);
}
