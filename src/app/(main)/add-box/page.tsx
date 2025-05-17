import { AddBoxForm } from '@/components/AddBoxForm';

export default function AddBoxPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Add New Box</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Capture your box contents and let AI help you organize.
        </p>
      </div>
      <AddBoxForm />
    </div>
  );
}
