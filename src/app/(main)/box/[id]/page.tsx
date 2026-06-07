import { BoxDetailClient } from '@/components/BoxDetailClient';

interface BoxDetailPageProps {
  params: Promise<{ id: string }>;
}

// This page itself can be a server component if data fetching from a real DB was involved.
// But since we use localStorage, the actual data fetching and rendering logic is in BoxDetailClient.
export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { id } = await params;
  // We can still attempt to get box data here to decide if it's a 404 on the server,
  // but localStorage won't be available. For this example, we'll let the client handle it.
  // In a real app with a DB, you'd fetch here:
  // const box = await getBoxFromDb(params.id);
  // if (!box) {
  //   notFound();
  // }

  return <BoxDetailClient boxId={id} />;
}
