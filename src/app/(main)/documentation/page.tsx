
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Share2, Cloud, ArrowLeft, Library } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DocumentItem {
  id: string;
  title: string;
  generatedDate: string;
  icon: React.ElementType;
}

interface ExportOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

const mockDocuments: DocumentItem[] = [
  { id: '1', title: 'Complete Inventory', generatedDate: 'Generated May 16, 2025', icon: FileText },
  { id: '2', title: 'Kitchen Boxes', generatedDate: 'Generated May 15, 2025', icon: FileText },
  { id: '3', title: 'Living Room Contents', generatedDate: 'Generated May 14, 2025', icon: FileText },
];

const mockExportOptions: ExportOption[] = [
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'cloud', label: 'Cloud', icon: Cloud },
];

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-card/50 p-6 rounded-lg shadow-md text-center">
    <p className="text-3xl font-bold text-primary">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{title}</p>
  </div>
);

export default function DocumentationPage() {
  const router = useRouter();

  // Mock data - replace with actual data fetching
  const inventorySummary = {
    boxes: 12,
    items: 86,
    rooms: 5,
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
          <Library className="mr-3 h-8 w-8 text-primary" />
          Documentation
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Generate and manage your moving inventory documents.
        </p>
      </div>

      <Separator className="my-8" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Inventory Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="Boxes" value={inventorySummary.boxes} />
          <StatCard title="Items" value={inventorySummary.items} />
          <StatCard title="Rooms" value={inventorySummary.rooms} />
        </div>
        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3">
          Generate Full Inventory
        </Button>
      </section>

      <Separator className="my-8" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Available Documents</h2>
        <div className="space-y-4">
          {mockDocuments.map((doc) => (
            <Card key={doc.id} className="shadow-md hover:shadow-lg transition-shadow bg-card/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <doc.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.generatedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" aria-label="Download document">
                    <Download className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="View document">
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {mockDocuments.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No documents generated yet.</p>
        )}
      </section>
      
      <Separator className="my-8" />

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Export Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {mockExportOptions.map((option) => (
            <Card key={option.id} className="shadow-md hover:shadow-lg transition-shadow text-center bg-card/80 cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-primary/20 p-4 rounded-full mb-4">
                  <option.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">{option.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
