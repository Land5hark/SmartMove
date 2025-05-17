
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Camera, CheckCircle, AlertTriangle, Wand2, Trash2, Video, XCircle, SwitchCamera } from 'lucide-react';
import type { Box, Room } from '@/types';
import { ROOM_OPTIONS } from '@/types';
import { saveBox, generateUniqueId } from '@/lib/store';
import { generateItemTags } from '@/ai/flows/generate-item-tags';
import { suggestRoomPlacement } from '@/ai/flows/suggest-room-placement';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingBox?.photoDataUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [isSuggestingRoom, setIsSuggestingRoom] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>(existingBox?.aiGeneratedTags || []);
  const [aiSuggestedRoom, setAiSuggestedRoom] = useState<string | null>(existingBox?.suggestedRoom || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');


  const form = useForm<AddBoxFormValues>({
    resolver: zodResolver(addBoxFormSchema),
    defaultValues: {
      id: existingBox?.id || generateUniqueId().substring(0,8),
      manualDescription: existingBox?.manualDescription || '',
      assignedRoom: existingBox?.assignedRoom || '',
    },
  });

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const getCameraStream = async () => {
      // Stop any existing stream before getting a new one
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }

      if (isCameraOpen) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode }
          });
          localStream = mediaStream;
          setStream(mediaStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Could not access the specified camera. Please check permissions or try another camera type.',
          });
          setIsCameraOpen(false);
        }
      }
    };

    getCameraStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
    };
  }, [isCameraOpen, currentFacingMode, toast]);

  const handleFlipCamera = () => {
    setCurrentFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
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
        triggerAiTagging(reader.result as string);
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
      const context = canvas.getContext('2d');
      if (context) {
        if (currentFacingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhotoPreview(dataUrl);
        setPhotoFile(null);
        triggerAiTagging(dataUrl);
        setIsCameraOpen(false);
      } else {
        toast({ title: "Error capturing photo", description: "Could not get canvas context.", variant: "destructive" });
      }
    } else {
       toast({ title: "Error capturing photo", description: "Camera or canvas not ready.", variant: "destructive" });
    }
  };

  const triggerAiTagging = async (photoDataUrl: string) => {
    setIsTagging(true);
    setAiTags([]);
    try {
      const result = await generateItemTags({ photoDataUri: photoDataUrl });
      setAiTags(result.itemTags);
      toast({
        title: 'AI Tagging Complete',
        description: `${result.itemTags.length} tags generated.`,
      });
      triggerAiRoomSuggestion(result.itemTags.join(', '));
    } catch (error) {
      console.error('AI Tagging Error:', error);
      toast({
        title: 'AI Tagging Failed',
        description: 'Could not generate tags for the image. Please try again or add manually.',
        variant: 'destructive',
      });
    } finally {
      setIsTagging(false);
    }
  };

  const triggerAiRoomSuggestion = async (itemDescription: string) => {
    if (!itemDescription && !form.getValues('manualDescription')) {
      setAiSuggestedRoom(null);
      return;
    }

    setIsSuggestingRoom(true);
    setAiSuggestedRoom(null);
    const descriptionToUse = itemDescription || form.getValues('manualDescription') || "";

    if (!descriptionToUse.trim()) {
      setIsSuggestingRoom(false);
      return;
    }

    try {
      const result = await suggestRoomPlacement({ itemDescription: descriptionToUse });
      setAiSuggestedRoom(result.suggestedRoom);
      toast({
        title: 'AI Room Suggestion',
        description: `Suggested room: ${result.suggestedRoom}.`,
      });
    } catch (error) {
      console.error('AI Room Suggestion Error:', error);
      toast({
        title: 'AI Room Suggestion Failed',
        description: 'Could not suggest a room. Please assign manually.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggestingRoom(false);
    }
  };

  const onSubmit = (data: AddBoxFormValues) => {
    const boxToSave: Omit<Box, 'createdAt' | 'qrCodeValue'> & { id?: string } = {
      id: data.id || existingBox?.id,
      manualDescription: data.manualDescription,
      assignedRoom: data.assignedRoom,
      photoDataUrl: photoPreview || undefined,
      aiGeneratedTags: aiTags,
      suggestedRoom: aiSuggestedRoom || undefined,
      items: [],
    };

    const savedBox = saveBox(boxToSave);
    toast({
      title: existingBox ? 'Box Updated!' : 'Box Added!',
      description: `Box #${savedBox.id.substring(0,6)} has been successfully ${existingBox ? 'updated' : 'saved'}.`,
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push(`/box/${savedBox.id}`)}>
          View Box
        </Button>
      ),
    });
    router.push('/');
  };

  const openCamera = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCurrentFacingMode('environment');
    setIsCameraOpen(true);
  };

  const openFileUpload = () => {
    setIsCameraOpen(false);
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setAiTags([]);
    setAiSuggestedRoom(null);
    setIsCameraOpen(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Box Identifier</CardTitle>
            <CardDescription>Unique ID for your box. This will be part of the QR code.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., KITCH001 or unique hash" {...field} readOnly={!!existingBox || form.formState.isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    {existingBox ? "This ID cannot be changed." : "A unique ID for this box. Keep it short if handwriting."}
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
            <CardDescription>Add a photo of the items inside the box using your camera or by uploading an image.</CardDescription>
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
              <div className="flex gap-2 flex-wrap">
                <Button type="button" variant="outline" onClick={openFileUpload}>
                  <Camera className="mr-2 h-4 w-4" /> Upload Photo
                </Button>
                <Button type="button" variant="outline" onClick={openCamera}>
                  <Video className="mr-2 h-4 w-4" /> Take Photo with Camera
                </Button>
              </div>
            )}

            {isCameraOpen && (
              <div className="space-y-4">
                <div className="relative">
                  <video ref={videoRef} className="w-full aspect-video rounded-md border bg-muted" autoPlay muted playsInline />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleFlipCamera}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
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
                      Please allow camera access in your browser settings to use this feature. You might need to refresh the page after granting permission.
                    </AlertDescription>
                  </Alert>
                )}
                 {hasCameraPermission === true && (
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" onClick={handleCapturePhoto} disabled={!stream}>
                      <Camera className="mr-2 h-4 w-4" /> Capture Photo
                    </Button>
                     <Button type="button" variant="outline" onClick={() => setIsCameraOpen(false)}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancel Camera
                    </Button>
                  </div>
                )}
                <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => { setIsCameraOpen(false); openFileUpload(); }}>
                  Or Upload Photo Instead
                </Button>
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

            {isTagging && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is analyzing your photo...
              </div>
            )}
            {aiTags.length > 0 && (
              <div>
                <FormLabel>AI Generated Tags:</FormLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Add manual notes about the contents, especially for fragile or important items.</CardDescription>
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
            <CardDescription>Assign this box to a room in your new place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuggestingRoom && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is suggesting a room...
              </div>
            )}
            {aiSuggestedRoom && (
              <div className="p-3 bg-accent/20 border border-accent rounded-md">
                <div className="flex items-center">
                  <Wand2 className="mr-2 h-5 w-5 text-accent-foreground" />
                  <p className="text-sm font-medium text-accent-foreground">AI Suggestion: <span className="font-semibold">{aiSuggestedRoom}</span></p>
                </div>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1 text-accent-foreground"
                  onClick={() => {
                    form.setValue('assignedRoom', aiSuggestedRoom as Room, { shouldValidate: true });
                    toast({ title: "Room Applied", description: `${aiSuggestedRoom} has been set as the assigned room.`});
                  }}
                >
                  Use this suggestion
                </Button>
              </div>
            )}
            <FormField
              control={form.control}
              name="assignedRoom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || isTagging || isSuggestingRoom || (isCameraOpen && hasCameraPermission === null) || (isCameraOpen && !hasCameraPermission && !stream) }>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              existingBox ? <CheckCircle className="mr-2 h-4 w-4" /> : null
            )}
            {existingBox ? 'Update Box' : 'Save Box'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    