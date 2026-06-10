"use client";

import { identifyBoxItems } from "@/ai/flows/identify-box-items";
import { suggestRoomPlacement } from "@/ai/flows/suggest-room-placement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScanReviewClient } from "@/components/ScanReviewClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { generateBoxId, saveBox } from "@/lib/supabase-boxes";
import type { Box, Room, ScanMode, ScanResult } from "@/types";
import { ROOM_OPTIONS } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertTriangle,
    Camera,
    CheckCircle,
    Loader2,
    SwitchCamera,
    Trash2,
    Video,
    Wand2,
    XCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const addBoxFormSchema = z.object({
  id: z.string().optional(),
  manualDescription: z.string().optional(),
  assignedRoom: z.string().optional(),
});

type AddBoxFormValues = z.infer<typeof addBoxFormSchema>;

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function AddBoxForm({ existingBox }: { existingBox?: Box }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingBox?.photoDataUrl || null,
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [reviewedItems, setReviewedItems] = useState(existingBox?.items || []);
  const [isSuggestingRoom, setIsSuggestingRoom] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>(
    existingBox?.aiGeneratedTags || [],
  );
  const [aiSuggestedRoom, setAiSuggestedRoom] = useState<string | null>(
    existingBox?.suggestedRoom || null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >("environment");

  const form = useForm<AddBoxFormValues>({
    resolver: zodResolver(addBoxFormSchema),
    defaultValues: {
      id: existingBox?.id || generateBoxId().substring(0, 8),
      manualDescription: existingBox?.manualDescription || "",
      assignedRoom: existingBox?.assignedRoom || "",
    },
  });

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const getCameraStream = async () => {
      // Stop any existing stream before getting a new one
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      if (isCameraOpen) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
          });
          localStream = mediaStream;
          setStream(mediaStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description:
              "Could not access the specified camera. Please check permissions or try another camera type.",
          });
          setIsCameraOpen(false);
        }
      }
    };

    getCameraStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isCameraOpen, currentFacingMode, toast]);

  const handleFlipCamera = () => {
    setCurrentFacingMode((prevMode) =>
      prevMode === "user" ? "environment" : "user",
    );
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        setPhotoPreview(null);
        setPhotoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        triggerItemScan(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        if (currentFacingMode === "user") {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setPhotoPreview(dataUrl);
        setPhotoFile(null);
        triggerItemScan(dataUrl);
        setIsCameraOpen(false);
      } else {
        toast({
          title: "Error capturing photo",
          description: "Could not get canvas context.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error capturing photo",
        description: "Camera or canvas not ready.",
        variant: "destructive",
      });
    }
  };

  const triggerItemScan = async (photoDataUrl: string) => {
    setIsScanning(true);
    setShowReview(false);
    setScanResult(null);
    try {
      const result = await identifyBoxItems({
        photoDataUri: photoDataUrl,
        scanMode: "balanced",
      });
      setScanResult(result);
      setShowReview(true);
      toast({
        title: "AI Scan Complete",
        description: `${result.items.length} items detected.`,
      });
      if (result.items.length > 0) {
        const tags = result.items.map((i) => i.label);
        setAiTags(tags);
        triggerAiRoomSuggestion(tags.join(", "));
      }
    } catch (error) {
      console.error("AI Scan Error:", error);
      toast({
        title: "AI Scan Failed",
        description:
          "Could not identify items in the image. You can add them manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescan = async (mode: ScanMode) => {
    if (!photoPreview) return;
    setIsScanning(true);
    try {
      const result = await identifyBoxItems({
        photoDataUri: photoPreview,
        scanMode: mode,
      });
      setScanResult(result);
      setShowReview(true);
      toast({
        title: "Rescan Complete",
        description: `${result.items.length} items detected.`,
      });
    } catch (error) {
      console.error("Rescan Error:", error);
      toast({
        title: "Rescan Failed",
        description: "Please try again or add items manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReviewSave = (items: import("@/types").BoxItem[]) => {
    setReviewedItems(items);
    setShowReview(false);
    const tags = items.map((i) => i.name);
    setAiTags(tags);
    toast({
      title: "Items saved",
      description: `${items.length} items confirmed.`,
    });
  };

  const handleRetakePhoto = () => {
    setShowReview(false);
    setScanResult(null);
    setReviewedItems([]);
    removePhoto();
  };

  const handleCancelReview = () => {
    setShowReview(false);
    setScanResult(null);
  };

  const triggerAiRoomSuggestion = async (itemDescription: string) => {
    if (!itemDescription && !form.getValues("manualDescription")) {
      setAiSuggestedRoom(null);
      return;
    }

    setIsSuggestingRoom(true);
    setAiSuggestedRoom(null);
    const descriptionToUse =
      itemDescription || form.getValues("manualDescription") || "";

    if (!descriptionToUse.trim()) {
      setIsSuggestingRoom(false);
      return;
    }

    try {
      const result = await suggestRoomPlacement({
        itemDescription: descriptionToUse,
      });
      setAiSuggestedRoom(result.suggestedRoom);
      toast({
        title: "AI Room Suggestion",
        description: `Suggested room: ${result.suggestedRoom}.`,
      });
    } catch (error) {
      console.error("AI Room Suggestion Error:", error);
      toast({
        title: "AI Room Suggestion Failed",
        description: "Could not suggest a room. Please assign manually.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingRoom(false);
    }
  };

  const onSubmit = async (data: AddBoxFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not signed in", description: "Please sign in to save boxes." });
      return;
    }
    const boxId = data.id || existingBox?.id || generateBoxId();
    try {
      const savedBox = await saveBox(user.id, {
        id: boxId,
        manualDescription: data.manualDescription,
        assignedRoom: data.assignedRoom,
        photoDataUrl: photoPreview || undefined,
        photoPath: existingBox?.photoPath,
        photoUrl: existingBox?.photoUrl,
        aiGeneratedTags: aiTags,
        suggestedRoom: aiSuggestedRoom || undefined,
        createdAt: existingBox?.createdAt,
        items: reviewedItems,
      });
      toast({
        title: existingBox ? "Box Updated!" : "Box Added!",
        description: `Box #${savedBox.id.substring(0, 6)} has been successfully ${existingBox ? "updated" : "saved"}.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/box/${savedBox.id}`)}
          >
            View Box
          </Button>
        ),
      });
      router.push("/");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to save box",
        description: err instanceof Error ? err.message : "An error occurred.",
      });
    }
  };

  const openCamera = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCurrentFacingMode("environment");
    setIsCameraOpen(true);
  };

  const openFileUpload = () => {
    setIsCameraOpen(false);
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setShowReview(false);
    setScanResult(null);
    setReviewedItems([]);
    setAiTags([]);
    setAiSuggestedRoom(null);
    setIsCameraOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Box Identifier</CardTitle>
            <CardDescription>
              Unique ID for your box. This will be part of the QR code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., KITCH001 or unique hash"
                      {...field}
                      readOnly={!!existingBox || form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {existingBox
                      ? "This ID cannot be changed."
                      : "A unique ID for this box. Keep it short if handwriting."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Box Contents Photo</CardTitle>
            <CardDescription>
              Add a photo of the items inside the box using your camera or by
              uploading an image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              ref={fileInputRef}
              id="photoUpload"
            />
            <canvas ref={canvasRef} className="hidden"></canvas>

            {!photoPreview && !isCameraOpen && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={openCamera}
                  className="group relative flex h-48 w-full items-center justify-center rounded-card border-2 border-dashed border-primary/30 bg-secondary/30 transition-colors hover:border-primary/60 hover:bg-secondary/50"
                >
                  <div className="absolute inset-0 rounded-card bg-gradient-hero opacity-0 blur-xl transition-opacity group-hover:opacity-10" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-pink-cyan glow-pink">
                      <Camera className="h-7 w-7 text-midnight" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Tap to open camera</span>
                    <span className="text-xs text-muted-foreground">AI will detect items automatically</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={openFileUpload}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  or upload from library
                </button>
              </div>
            )}

            {isCameraOpen && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-card">
                  <video
                    ref={videoRef}
                    className="w-full aspect-[3/4] rounded-card bg-black object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleFlipCamera}
                    className="absolute top-3 right-3 rounded-full bg-background/60 backdrop-blur-sm"
                    title="Flip Camera"
                  >
                    <SwitchCamera className="h-5 w-5" />
                  </Button>
                </div>
                {hasCameraPermission === false && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                      Please allow camera access in your browser settings to use
                      this feature. You might need to refresh the page after
                      granting permission.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCameraOpen(false)}
                    className="h-12 w-12 rounded-full"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                  <button
                    type="button"
                    title="Capture photo"
                    onClick={handleCapturePhoto}
                    disabled={!stream}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-pink-cyan glow-pink transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="h-8 w-8 text-midnight" />
                    <span className="sr-only">Capture photo</span>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => { setIsCameraOpen(false); openFileUpload(); }}
                    className="h-12 w-12 rounded-full"
                    title="Upload instead"
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {photoPreview && !isCameraOpen && (
              <div className="mt-4 relative group">
                <Image
                  src={photoPreview}
                  alt="Box contents preview"
                  width={500}
                  height={300}
                  className="rounded-md object-contain max-h-[300px] w-auto mx-auto border"
                  data-ai-hint="moving box items"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={openFileUpload}
                    title="Change Photo (Upload)"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change Photo (Upload)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={openCamera}
                    title="Change Photo (Camera)"
                  >
                    <Video className="h-4 w-4" />
                    <span className="sr-only">Change Photo (Camera)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={removePhoto}
                    title="Remove Photo"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove Photo</span>
                  </Button>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is scanning your photo…</span>
              </div>
            )}

            {showReview && scanResult && photoPreview && (
              <div className="mt-4">
                <ScanReviewClient
                  photoPreview={photoPreview}
                  scanResult={scanResult}
                  onSave={handleReviewSave}
                  onRescan={handleRescan}
                  onRetakePhoto={handleRetakePhoto}
                  onCancel={handleCancelReview}
                />
              </div>
            )}

            {!showReview && aiTags.length > 0 && !isScanning && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  AI Detected
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiTags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>
              Add manual notes about the contents, especially for fragile or
              important items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="manualDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manual Notes / Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Fragile glassware, important documents, electronics chargers..."
                      className="resize-y min-h-[100px]"
                      {...field}
                      onBlur={() => {
                        if (!aiTags.length && !photoPreview) {
                          triggerAiRoomSuggestion(field.value || "");
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Room Assignment</CardTitle>
            <CardDescription>
              Assign this box to a room in your new place.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuggestingRoom && (
              <div className="flex items-center gap-2 text-sm text-accent">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is suggesting a room…</span>
              </div>
            )}
            {aiSuggestedRoom && (
              <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2">
                <Wand2 className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-sm">
                  AI suggests:{" "}
                  <span className="font-semibold text-accent">{aiSuggestedRoom}</span>
                </span>
                <button
                  type="button"
                  className="ml-auto text-xs text-accent underline underline-offset-2"
                  onClick={() => {
                    form.setValue("assignedRoom", aiSuggestedRoom as Room, {
                      shouldValidate: true,
                    });
                    toast({
                      title: "Room Applied",
                      description: `${aiSuggestedRoom} has been set as the assigned room.`,
                    });
                  }}
                >
                  Apply
                </button>
              </div>
            )}
            <FormField
              control={form.control}
              name="assignedRoom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Room</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={
              form.formState.isSubmitting ||
              isScanning ||
              showReview ||
              isSuggestingRoom ||
              (isCameraOpen && hasCameraPermission === null) ||
              (isCameraOpen && !hasCameraPermission && !stream)
            }
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : existingBox ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : null}
            {existingBox ? "Update Box" : "Save Box"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
