import { EditBoxClient } from "@/components/EditBoxClient";

interface EditBoxPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBoxPage({ params }: EditBoxPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Edit Box
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Update your box contents, photo, and room assignment.
        </p>
      </div>
      <EditBoxClient boxId={id} />
    </div>
  );
}
