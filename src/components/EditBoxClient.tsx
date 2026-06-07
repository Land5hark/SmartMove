"use client";

import { AddBoxForm } from "@/components/AddBoxForm";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getBox } from "@/lib/supabase-boxes";
import type { Box } from "@/types";
import { useEffect, useState } from "react";

export function EditBoxClient({ boxId }: { boxId: string }) {
  const { loading: authLoading, user } = useAuth();
  const [box, setBox] = useState<Box | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBox(null);
      return;
    }

    void getBox(user.id, boxId).then((fetchedBox) => setBox(fetchedBox));
  }, [authLoading, boxId, user]);

  if (box === undefined) {
    return <p className="text-center text-muted-foreground">Loading box...</p>;
  }

  if (box === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Box not found.
        </CardContent>
      </Card>
    );
  }

  return <AddBoxForm existingBox={box} />;
}
