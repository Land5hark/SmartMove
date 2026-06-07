import { AddBoxForm } from '@/components/AddBoxForm';

export default function AddBoxPage() {
  return (
    <div className="px-4 pb-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text-primary">New Box</h1>
        <p className="text-sm text-muted-foreground">
          Point your camera — AI detects everything.
        </p>
      </div>
      <AddBoxForm />
    </div>
  );
}
