import { BoxDetailClient } from '@/components/BoxDetailClient';
import { getBox } from '@/lib/store';
import { notFound } from 'next/navigation';

interface BoxDetailPageProps {
  params: { id: string };
}

// This page itself can be a server component if data fetching from a real DB was involved.
// But since we use localStorage, the actual data fetching and rendering logic is in BoxDetailClient.
export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  // We can still attempt to get box data here to decide if it's a 404 on the server,
  // but localStorage won't be available. For this example, we'll let the client handle it.
  // In a real app with a DB, you'd fetch here:
  // const box = await getBoxFromDb(params.id);
  // if (!box) {
  //   notFound();
  // }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <BoxDetailClient boxId={params.id} />
    </div>
  );
}
