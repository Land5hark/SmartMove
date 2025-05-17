'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Box } from '@/types';
import { getBox, deleteBox } from '@/lib/store';
import { ArrowLeft, Edit3, Printer, Trash2, QrCode, Package, MapPin, Info, CalendarDays } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"


interface BoxDetailClientProps {
  boxId: string;
}

export function BoxDetailClient({ boxId }: BoxDetailClientProps) {
  const [box, setBox] = useState<Box | null | undefined>(undefined); // undefined for loading, null for not found
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchedBox = getBox(boxId);
    setBox(fetchedBox || null);
  }, [boxId]);

  const handleDelete = () => {
    if (box) {
      deleteBox(box.id);
      toast({
        title: 'Box Deleted',
        description: `Box #${box.id.substring(0,6)} has been deleted.`,
      });
      router.push('/');
    }
  };

  if (box === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <ArrowLeft className="mr-2 h-4 w-4 animate-ping" /> Loading box details...
      </div>
    );
  }

  if (box === null) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle className="text-2xl">Box Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">The box with ID "{boxId}" could not be found.</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">Box #{box.id.substring(0,8)}...</CardTitle>
              {box.assignedRoom && (
                <CardDescription className="text-lg flex items-center mt-1">
                  <MapPin className="mr-2 h-5 w-5 text-primary" /> Assigned to: {box.assignedRoom}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-background shadow-sm">
                <QrCode className="h-8 w-8 text-foreground" data-ai-hint="qr code" />
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">QR Value</p>
                    <p className="font-mono text-sm font-semibold">{box.qrCodeValue.substring(0,8)}</p>
                </div>
            </div>
          </div>
        </CardHeader>

        {box.photoDataUrl && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-2">Photo of Contents</h3>
            <Image
              src={box.photoDataUrl}
              alt={`Contents of box ${box.id}`}
              width={600}
              height={400}
              className="rounded-lg object-cover w-full max-h-[400px] border shadow-md"
              data-ai-hint="moving box items"
            />
          </div>
        )}

        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Package className="mr-2 h-5 w-5 text-primary" />AI Generated Tags</h3>
            {box.aiGeneratedTags && box.aiGeneratedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {box.aiGeneratedTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No AI tags available.</p>
            )}
          </div>

          {box.manualDescription && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Manual Notes</h3>
              <p className="text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{box.manualDescription}</p>
            </div>
          )}

          {box.suggestedRoom && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" />AI Suggested Room</h3>
              <p className="text-foreground font-medium">{box.suggestedRoom}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" />Date Created</h3>
            <p className="text-foreground">{new Date(box.createdAt).toLocaleString()}</p>
          </div>

        </CardContent>
        <Separator />
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-end gap-3 bg-muted/30">
          <Button variant="outline" asChild>
            <Link href={`/box/${box.id}/print`}>
              <Printer className="mr-2 h-4 w-4" /> Print Label / Summary
            </Link>
          </Button>
          <Button variant="secondary" disabled> {/* Edit functionality could be added later */}
            <Edit3 className="mr-2 h-4 w-4" /> Edit Box (Soon)
          </Button>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Box
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the box
                  and all its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
