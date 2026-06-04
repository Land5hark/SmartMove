
'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Search, Package, MapPin, QrCode, UploadCloud } from 'lucide-react';
import type { Box } from '@/types';
import { getBoxes as getLegacyBoxes } from '@/lib/store';
import { importLegacyBox, listBoxes } from '@/lib/firebase-boxes';
import { useAuth } from '@/lib/auth';

const BoxCard: React.FC<{ box: Box }> = ({ box }) => {
  return (
    <Card className="flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Box #{box.id.substring(0, 6)}...</span>
          <QrCode className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          {box.assignedRoom ? (
            <span className="flex items-center text-sm">
              <MapPin className="mr-1 h-4 w-4" /> {box.assignedRoom}
            </span>
          ) : (
            <span className="italic text-muted-foreground">No room assigned</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {box.photoUrl || box.photoDataUrl ? (
          <div className="mb-2 aspect-video w-full rounded-md bg-muted relative overflow-hidden">
            <Image
              src={box.photoUrl || box.photoDataUrl || ''}
              alt={`Contents of box ${box.id.substring(0, 6)}`}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
              data-ai-hint="moving box items"
            />
          </div>
        ) : (
          <div className="mb-2 aspect-video w-full rounded-md bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" data-ai-hint="package box" />
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <Package className="mr-1 h-4 w-4" />
          <span>{box.aiGeneratedTags?.length || 0} items tagged</span>
        </div>
        {box.manualDescription && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            Notes: {box.manualDescription}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/box/${box.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};


const Home: NextPage = () => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [legacyBoxes, setLegacyBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const router = useRouter();
  const { configured, loading: authLoading, user } = useAuth();

  const loadBoxes = useCallback(async () => {
    if (authLoading) return;
    if (!configured || !user) {
      setBoxes([]);
      setLegacyBoxes(getLegacyBoxes());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBoxes(await listBoxes(user.uid));
      setLegacyBoxes(getLegacyBoxes());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load boxes.');
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, configured, user]);

  useEffect(() => {
    void loadBoxes();
  }, [loadBoxes]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      router.push(`/box/${scanInput.trim()}`);
    }
  };

  const handleImportLegacy = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await Promise.all(legacyBoxes.map(box => importLegacyBox(user.uid, box)));
      await loadBoxes();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Could not import local boxes.');
      setIsLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <Card className="text-center py-12 shadow-lg">
          <CardContent>
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-muted-foreground">Sign in to manage your move.</p>
            <p className="text-muted-foreground mb-6">Your boxes, photos, and labels will sync across web and Android.</p>
            <Button asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <section className="mb-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Scan Box QR Code</CardTitle>
            <CardDescription>Enter the Box ID from the QR code to quickly find its details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScanSubmit} className="flex items-end gap-4">
              <div className="flex-grow">
                <Label htmlFor="boxIdScan" className="mb-1 block">Box ID</Label>
                <Input
                  id="boxIdScan"
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Enter Box ID (e.g., 1a2b3c)"
                />
              </div>
              <Button type="submit" size="lg">
                <Search className="mr-2 h-5 w-5" /> Find Box
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold">My Boxes</h2>
          <Button asChild>
            <Link href="/add-box">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Box
            </Link>
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {legacyBoxes.length > 0 && (
          <Card className="mb-6">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Found {legacyBoxes.length} local prototype {legacyBoxes.length === 1 ? 'box' : 'boxes'} that can be imported to Firebase.
              </p>
              <Button type="button" variant="outline" onClick={handleImportLegacy} disabled={isLoading}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Import Local Boxes
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading boxes...
          </div>
        ) : boxes.length === 0 ? (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No boxes added yet.</p>
              <p className="text-muted-foreground mb-6">Start by adding your first box!</p>
              <Button asChild size="lg">
                <Link href="/add-box">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add First Box
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxes.map((box) => (
              <BoxCard key={box.id} box={box} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
