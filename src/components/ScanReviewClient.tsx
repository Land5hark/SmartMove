"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { BoxItem, ScanItem, ScanMode, ScanResult } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

interface ScanReviewClientProps {
  photoPreview: string;
  photoCount?: number;
  scanResult: ScanResult;
  onSave: (items: BoxItem[]) => void;
  onRescan: (mode: ScanMode) => void;
  onRetakePhoto: () => void;
  onCancel: () => void;
}

function bboxHintToPosition(hint?: string): { x: number; y: number } {
  const h = (hint ?? "center").toLowerCase().trim();
  const map: Record<string, { x: number; y: number }> = {
    "top-left":      { x: 22, y: 20 },
    "top-right":     { x: 78, y: 20 },
    "top-center":    { x: 50, y: 20 },
    "top":           { x: 50, y: 20 },
    "center":        { x: 50, y: 50 },
    "middle":        { x: 50, y: 50 },
    "bottom-left":   { x: 22, y: 80 },
    "bottom-right":  { x: 78, y: 80 },
    "bottom-center": { x: 50, y: 80 },
    "bottom":        { x: 50, y: 80 },
    "left":          { x: 18, y: 50 },
    "right":         { x: 82, y: 50 },
  };
  return map[h] ?? { x: 50, y: 50 };
}

function scanItemToBoxItem(item: ScanItem): BoxItem {
  return {
    id: crypto.randomUUID(),
    name: item.label,
    normalizedLabel: item.normalized_label,
    count: item.count,
    confidence: item.confidence,
    category: item.normalized_label,
    bboxHint: item.bbox_hint,
    attributes: item.attributes,
    notes: item.notes,
  };
}

function boxItemToEditFields(item: BoxItem) {
  return {
    name: item.name,
    count: item.count ?? 1,
  };
}

export function ScanReviewClient({
  photoPreview,
  photoCount = 1,
  scanResult,
  onSave,
  onRescan,
  onRetakePhoto,
  onCancel,
}: ScanReviewClientProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<BoxItem[]>(
    () => scanResult.items.map(scanItemToBoxItem),
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; count: number } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const photoRef = useRef<HTMLDivElement>(null);

  const confidenceColor = (c?: "high" | "medium" | "low") => {
    switch (c) {
      case "high":   return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300";
      default:       return "";
    }
  };

  const selectItem = (id: string | null) => {
    setSelectedItemId(id);
    if (id) {
      itemRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const selectItemFromList = (id: string) => {
    const next = id === selectedItemId ? null : id;
    setSelectedItemId(next);
    if (next) {
      photoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (item: BoxItem) => {
    setEditingId(item.id);
    setEditValues(boxItemToEditFields(item));
  };

  const saveEdit = () => {
    if (!editingId || !editValues) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? { ...item, name: editValues.name, count: editValues.count }
          : item,
      ),
    );
    setEditingId(null);
    setEditValues(null);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
    toast({ title: "Item removed", description: "You can add it back manually." });
  };

  const addItem = () => {
    const newItem: BoxItem = {
      id: crypto.randomUUID(),
      name: "New Item",
      count: 1,
      confidence: "medium",
      notes: "Added manually",
    };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
    setEditValues({ name: "New Item", count: 1 });
  };

  const saveAndClose = () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "No items", description: "Add at least one item before saving." });
      return;
    }
    onSave(items);
  };

  const hasLowConfidence = items.some((i) => i.confidence === "low");
  const confidenceSummary = useMemo(() => ({
    high:   items.filter((i) => i.confidence === "high").length,
    medium: items.filter((i) => i.confidence === "medium").length,
    low:    items.filter((i) => i.confidence === "low").length,
  }), [items]);

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      {(scanResult.warnings.length > 0 || hasLowConfidence) && (
        <Card className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Review recommended</p>
              {scanResult.warnings.map((w, i) => (
                <p key={i} className="text-yellow-700 dark:text-yellow-300">{w}</p>
              ))}
              {hasLowConfidence && (
                <p className="text-yellow-700 dark:text-yellow-300">
                  Some items have low confidence — verify them below.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo with dot overlay */}
      <div ref={photoRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
        <Image src={photoPreview} alt="Box contents" fill className="object-contain" />

        {items.map((item, idx) => {
          const pos = bboxHintToPosition(item.bboxHint);
          const isSelected = selectedItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => selectItem(isSelected ? null : item.id)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-150 select-none
                ${isSelected
                  ? "h-8 w-8 scale-110 bg-primary text-primary-foreground shadow-lg ring-2 ring-white"
                  : "h-6 w-6 bg-black/60 text-white hover:scale-110 hover:bg-primary/80"
                }`}
            >
              {idx + 1}
            </button>
          );
        })}

        {selectedItemId && (() => {
          const item = items.find((i) => i.id === selectedItemId);
          if (!item) return null;
          const pos = bboxHintToPosition(item.bboxHint);
          return (
            <div
              style={{ left: `${pos.x}%`, top: `${pos.y + 6}%` }}
              className="absolute -translate-x-1/2 max-w-[140px] rounded bg-black/75 px-2 py-1 text-[10px] text-white text-center leading-tight pointer-events-none"
            >
              {item.name}{item.count && item.count > 1 ? ` ×${item.count}` : ""}
            </div>
          );
        })()}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{items.length} items detected</span>
        {photoCount > 1 && (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            {photoCount} photos
          </Badge>
        )}
        {confidenceSummary.high > 0 && (
          <Badge variant="outline" className="border-green-300 text-green-700">
            {confidenceSummary.high} high
          </Badge>
        )}
        {confidenceSummary.medium > 0 && (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            {confidenceSummary.medium} med
          </Badge>
        )}
        {confidenceSummary.low > 0 && (
          <Badge variant="outline" className="border-red-300 text-red-700">
            {confidenceSummary.low} low
          </Badge>
        )}
        {selectedItemId && (
          <button
            type="button"
            onClick={() => setSelectedItemId(null)}
            className="ml-auto text-[10px] underline underline-offset-2"
          >
            clear pin
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isSelected = selectedItemId === item.id;
          return (
            <Card
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              className={`overflow-hidden transition-all duration-150 ${isSelected ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Numbered dot — click to pin on photo */}
                <button
                  type="button"
                  title="Show on photo"
                  onClick={() => selectItemFromList(item.id)}
                  className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors
                    ${isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                    }`}
                >
                  {idx + 1}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValues?.name ?? ""}
                        onChange={(e) =>
                          setEditValues((prev) => prev ? { ...prev, name: e.target.value } : null)
                        }
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={editValues?.count ?? 1}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, count: Math.max(1, parseInt(e.target.value) || 1) } : null,
                          )
                        }
                        className="h-8 w-16 text-sm text-center"
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
                      />
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 px-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium cursor-pointer hover:text-primary truncate"
                        onClick={() => startEditing(item)}
                        title="Click to edit"
                      >
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ×{item.count ?? 1}
                      </span>
                    </div>
                  )}
                </div>

                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] px-1.5 py-0 ${confidenceColor(item.confidence)}`}
                >
                  {item.confidence || "unknown"}
                </Badge>
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {expandedItems.has(item.id) && (
                <div className="border-t border-border/50 px-3 py-2 space-y-1 text-xs text-muted-foreground">
                  {item.notes && <p>Note: {item.notes}</p>}
                  {item.attributes && item.attributes.length > 0 && (
                    <p>Attributes: {item.attributes.join(", ")}</p>
                  )}
                  {item.category && <p>Category: {item.category}</p>}
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="text-primary underline underline-offset-2"
                  >
                    Edit
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add item button */}
      <Button type="button" variant="outline" className="w-full" onClick={addItem}>
        <Plus className="mr-2 h-4 w-4" /> Add Missed Item
      </Button>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={saveAndClose}
          disabled={items.length === 0}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Save {items.length} {items.length === 1 ? "Item" : "Items"}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onRescan("high_accuracy")}>
            <RotateCcw className="mr-2 h-3 w-3" /> Rescan (High Accuracy)
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onRetakePhoto}>
            <RotateCcw className="mr-2 h-3 w-3" /> Retake Photo
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onCancel}
        >
          Discard scan and go back
        </Button>
      </div>
    </div>
  );
}
