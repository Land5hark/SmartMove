"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { deleteBox, getBox } from "@/lib/supabase-boxes";
import type { Box } from "@/types";
import {
    ArrowLeft,
    CalendarDays,
    Edit3,
    Info,
    MapPin,
    Package,
    Printer,
    QrCode,
    Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BoxDetailClientProps {
  boxId: string;
}

export function BoxDetailClient({ boxId }: BoxDetailClientProps) {
  const [box, setBox] = useState<Box | null | undefined>(undefined);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    getBox(user.id, boxId).then((b) => setBox(b));
  }, [boxId, user]);

  const handleDelete = async () => {
    if (!box || !user) return;
    try {
      await deleteBox(user.id, box.id);
      toast({ title: "Box Deleted", description: `Box #${box.id.substring(0, 6)} has been deleted.` });
      router.push("/");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "An error occurred.",
      });
    }
  };

  if (box === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Package className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (box === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Package className="mb-4 h-14 w-14 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-bold">Box Not Found</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The box &ldquo;{boxId}&rdquo; could not be found.
        </p>
        <Button asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
      </div>
    );
  }

  const photoSrc = box.photoUrl || box.photoDataUrl;

  return (
    <div className="pb-4">
      {/* Photo hero */}
      <div className="relative">
        {photoSrc ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={photoSrc}
              alt={`Contents of box ${box.id}`}
              fill
              className="object-cover"
              data-ai-hint="moving box items"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Back button overlay */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </button>

        {/* Action buttons overlay */}
        <div className="absolute right-4 top-4 flex gap-2">
          <Link
            href={`/box/${box.id}/print`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </Link>
          <Link
            href={`/box/${box.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </Link>
        </div>

        {/* Box identity overlay at photo bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="text-2xl font-bold">Box #{box.id.substring(0, 8)}</h1>
          {box.assignedRoom && (
            <div className="mt-1 flex items-center gap-1 text-sm text-foreground/80">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {box.assignedRoom}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 px-4 pt-4">
        {/* QR code info */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">QR Code ID</p>
              <p className="font-mono text-sm font-semibold">{box.qrCodeValue.substring(0, 12)}…</p>
            </div>
          </CardContent>
        </Card>

        {/* AI tags */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Detected Items
            </p>
            {box.aiGeneratedTags && box.aiGeneratedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {box.aiGeneratedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">No AI tags yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Manual notes */}
        {box.manualDescription && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{box.manualDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Meta */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {new Date(box.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Box
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this box?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Box #{box.id.substring(0, 8)} and all its data will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
