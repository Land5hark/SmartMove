"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { listBoxes } from "@/lib/supabase-boxes";
import type { Box } from "@/types";
import { MapPin, Package, PlusCircle, QrCode, Search } from "lucide-react";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BoxCard: React.FC<{ box: Box }> = ({ box }) => {
  const photoSrc = box.photoUrl || box.photoDataUrl;
  return (
    <Link href={`/box/${box.id}`} className="block">
      <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={`Box ${box.id.substring(0, 6)}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="moving box items"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          {box.assignedRoom && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              <MapPin className="h-2.5 w-2.5 text-primary" />
              {box.assignedRoom}
            </div>
          )}
          <div className="absolute right-2 top-2">
            <QrCode className="h-3.5 w-3.5 text-white/40" />
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">#{box.id.substring(0, 6)}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              {box.aiGeneratedTags?.length ?? 0}
            </span>
          </div>
          {box.manualDescription && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {box.manualDescription}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

const Home: NextPage = () => {
  const { user, loading } = useAuth();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user) {
      listBoxes(user.id).then(setBoxes).catch(console.error);
    } else {
      setBoxes([]);
    }
  }, [user]);

  const filtered = boxes.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.assignedRoom?.toLowerCase().includes(q) ||
      b.manualDescription?.toLowerCase().includes(q) ||
      b.aiGeneratedTags?.some((t) => t.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Package className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-8 rounded-full bg-gradient-hero opacity-20 blur-3xl" />
          <Package className="relative h-20 w-20 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">SmartMove</h1>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          AI remembers what&apos;s in every box so you don&apos;t have to.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">SmartMove</h1>
          <p className="text-xs text-muted-foreground">
            {boxes.length} {boxes.length === 1 ? "box" : "boxes"} packed
          </p>
        </div>
        <Button asChild size="icon" variant="outline" className="rounded-full">
          <Link href="/add-box">
            <PlusCircle className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search boxes, rooms, or items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full border-border/50 bg-secondary/40 pl-9"
        />
      </div>

      {/* Boxes grid */}
      {filtered.length === 0 && search ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No boxes match &ldquo;{search}&rdquo;</p>
        </div>
      ) : boxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -m-10 rounded-full bg-gradient-hero opacity-15 blur-3xl" />
            <Package className="relative h-16 w-16 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-bold">No Boxes Yet</h2>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            Your next chapter starts with the first box.
          </p>
          <Button asChild size="lg">
            <Link href="/add-box">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Box
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((box) => (
            <BoxCard key={box.id} box={box} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
