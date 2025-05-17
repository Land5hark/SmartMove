'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Package, MapPin, QrCode } from 'lucide-react';
import type { Box } from '@/types';
import { getBoxes } from '@/lib/store';
import Image from 'next/image';

const BoxCard: React.FC<{ box: Box }> = ({ box }) => {
  return (
    <Card className="flex flex-col">
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
        {box.photoDataUrl && (
          <div className="mb-2 aspect-video w-full overflow-hidden rounded-md">
            <Image 
              src={box.photoDataUrl} 
              alt={`Contents of box ${box.id}`} 
              width={300} 
              height={200} 
              className="object-cover w-full h-full"
              data-ai-hint="moving box items" 
            />
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
  const [scanInput, setScanInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    setBoxes(getBoxes());
  }, []);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      router.push(`/box/${scanInput.trim()}`);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <section className="mb-12">
        <Card>
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

        {boxes.length === 0 ? (
          <Card className="text-center py-12">
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
