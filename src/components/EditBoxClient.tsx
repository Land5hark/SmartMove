'use client';

import { useEffect, useState } from 'react';
import { AddBoxForm } from '@/components/AddBoxForm';
import { Card, CardContent } from '@/components/ui/card';
import type { Box } from '@/types';
import { getBox } from '@/lib/firebase-boxes';
import { useAuth } from '@/lib/auth';

export function EditBoxClient({ boxId }: { boxId: string }) {
  const { loading: authLoading, user } = useAuth();
  const [box, setBox] = useState<Box | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBox(null);
      return;
    }

    void getBox(user.uid, boxId).then(fetchedBox => setBox(fetchedBox));
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
