"use client";

import { MasterQR } from "@/components/MasterQR";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAppUrl, getBoxShareUrl } from "@/lib/app-url";
import {
  deleteDocument,
  downloadBlob,
  generateInventoryCsv,
  generateInventoryJson,
  generateInventoryText,
  getDocumentContent,
  getDocumentShareUrl,
  listDocuments,
  saveDocument,
  shareInventory,
  type InventoryDocument,
} from "@/lib/export";
import { useAuth } from "@/lib/auth";
import { listBoxes } from "@/lib/supabase-boxes";
import type { Box } from "@/types";
import {
  Archive,
  BookOpen,
  Box as BoxIcon,
  Cloud,
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function InventoryClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [documents, setDocuments] = useState<InventoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showBoxQRs, setShowBoxQRs] = useState(false);

  const appUrl = useMemo(() => getAppUrl(), []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedBoxes, fetchedDocs] = await Promise.all([
        listBoxes(user.id),
        listDocuments(user.id),
      ]);
      setBoxes(fetchedBoxes);
      setDocuments(fetchedDocs);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
      toast({
        variant: "destructive",
        title: "Failed to load inventory",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const itemCount = boxes.reduce(
      (sum, b) => sum + (b.items?.length || 0),
      0,
    );
    const rooms = new Set(
      boxes.map((b) => b.assignedRoom).filter((r): r is string => !!r),
    );
    return { boxCount: boxes.length, itemCount, roomCount: rooms.size };
  }, [boxes]);

  const masterInventoryUrl = useMemo(
    () => `${appUrl}/inventory`,
    [appUrl],
  );

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const content = generateInventoryText(boxes);
      const doc = await saveDocument(
        user.id,
        `Full Inventory - ${new Date().toLocaleDateString()}`,
        content,
        stats.boxCount,
        stats.itemCount,
      );
      setDocuments((prev) => [...prev, doc]);
      toast({
        title: "Inventory generated",
        description: "Document saved successfully.",
      });
    } catch (err) {
      console.error("Generate failed:", err);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description:
          err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (doc: InventoryDocument) => {
    try {
      const content = await getDocumentContent(doc.storagePath);
      if (!content) {
        toast({ variant: "destructive", title: "Document not found" });
        return;
      }
      downloadBlob(
        `${doc.title.replace(/[^a-z0-9]/gi, "_")}.txt`,
        content,
      );
      toast({ title: "Downloaded", description: doc.title });
    } catch {
      toast({
        variant: "destructive",
        title: "Download failed",
      });
    }
  };

  const handleView = async (doc: InventoryDocument) => {
    try {
      const content = await getDocumentContent(doc.storagePath);
      if (!content) {
        toast({ variant: "destructive", title: "Document not found" });
        return;
      }
      window.open(
        `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
        "_blank",
      );
    } catch {
      toast({
        variant: "destructive",
        title: "View failed",
      });
    }
  };

  const handleDelete = async (doc: InventoryDocument) => {
    if (!user) return;
    try {
      await deleteDocument(user.id, doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast({ title: "Deleted", description: doc.title });
    } catch {
      toast({
        variant: "destructive",
        title: "Delete failed",
      });
    }
  };

  const handleShare = async () => {
    const text = generateInventoryText(boxes);
    try {
      await shareInventory("SmartMove Inventory", text, masterInventoryUrl);
      toast({ title: "Shared" });
    } catch {
      toast({ title: "Copied to clipboard" });
    }
  };

  const handlePdf = () => {
    const content = generateInventoryText(boxes);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>SmartMove Inventory</title>
<style>
  body { font-family: monospace; white-space: pre-wrap; padding: 2rem; font-size: 12px; line-height: 1.5; }
  @media print { @page { margin: 15mm; } }
</style></head><body>${content.replace(/\n/g, "<br>")}</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleCloud = async () => {
    if (!user) return;
    try {
      const content = generateInventoryJson(boxes);
      const doc = await saveDocument(
        user.id,
        `Cloud Export - ${new Date().toLocaleDateString()}`,
        content,
        stats.boxCount,
        stats.itemCount,
      );
      const url = await getDocumentShareUrl(doc.storagePath);
      setDocuments((prev) => [...prev, doc]);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Uploaded & link copied",
          description: "Shareable link copied to clipboard.",
        });
      } else {
        toast({
          title: "Uploaded to cloud",
          description: "Document saved to cloud storage.",
        });
      }
    } catch (err) {
      console.error("Cloud export failed:", err);
      toast({
        variant: "destructive",
        title: "Cloud export failed",
        description:
          err instanceof Error ? err.message : "An error occurred.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text-primary flex items-center gap-2">
          <Archive className="h-6 w-6" />
          Inventory
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your boxes, generate reports, and export inventory data.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.boxCount}</p>
            <p className="text-xs text-muted-foreground">Boxes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.itemCount}
            </p>
            <p className="text-xs text-muted-foreground">Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.roomCount}
            </p>
            <p className="text-xs text-muted-foreground">Rooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Master QR */}
      <div className="mb-6">
        <MasterQR value={masterInventoryUrl} label="Master Inventory QR" />
      </div>

      {/* Generate & Export */}
      <div className="space-y-3 mb-6">
        <Button
          size="lg"
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || boxes.length === 0}
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Full Inventory
        </Button>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex-col gap-1 py-4 h-auto"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-[10px]">Share</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col gap-1 py-4 h-auto"
            onClick={handlePdf}
          >
            <Printer className="h-5 w-5" />
            <span className="text-[10px]">PDF</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col gap-1 py-4 h-auto"
            onClick={handleCloud}
          >
            <Cloud className="h-5 w-5" />
            <span className="text-[10px]">Cloud</span>
          </Button>
        </div>
      </div>

      {/* Per-box QR codes */}
      {boxes.length > 0 && (
        <div className="mb-6">
          <Button
            variant="ghost"
            className="w-full justify-between text-sm font-medium"
            onClick={() => setShowBoxQRs(!showBoxQRs)}
          >
            <span className="flex items-center gap-2">
              <BoxIcon className="h-4 w-4" />
              Box QR Codes ({boxes.length})
            </span>
            <span>{showBoxQRs ? "Hide" : "Show"}</span>
          </Button>
          {showBoxQRs && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {boxes.map((box) => {
                const photoSrc =
                  box.photoUrls?.[box.thumbnailIndex ?? 0] ??
                  box.photoUrl ??
                  box.photoDataUrl;
                const boxUrl = getBoxShareUrl(box.id);
                return (
                  <Card key={box.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      {photoSrc && (
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-secondary mb-2">
                          <Image
                            src={photoSrc}
                            alt={`Box ${box.id.substring(0, 6)}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs font-medium truncate mb-2">
                        #{box.id.substring(0, 8)}
                        {box.assignedRoom && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {box.assignedRoom}
                          </span>
                        )}
                      </p>
                      <div className="flex justify-center rounded-lg border border-border bg-white p-2">
                        <QRCodeCanvas
                          value={boxUrl}
                          size={100}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                          includeMargin
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Available Documents */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Saved Documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No documents yet. Generate your first inventory report above.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="shadow-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {doc.boxCount} boxes · {doc.itemCount} items ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleView(doc)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
