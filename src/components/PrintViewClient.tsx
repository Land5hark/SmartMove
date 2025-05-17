
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Box } from '@/types';
import { getBox } from '@/lib/store';
import { ArrowLeft, Printer, Package, MapPin, Info, CalendarDays } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; // Import QRCodeCanvas

interface PrintViewClientProps {
  boxId: string;
}

export function PrintViewClient({ boxId }: PrintViewClientProps) {
  const [box, setBox] = useState<Box | null | undefined>(undefined);

  useEffect(() => {
    const fetchedBox = getBox(boxId);
    setBox(fetchedBox || null);
  }, [boxId]);

  const handlePrint = () => {
    window.print();
  };

  if (box === undefined) {
    return <div className="p-8 text-center">Loading print view...</div>;
  }

  if (box === null) {
    return <div className="p-8 text-center text-red-500">Box not found. Cannot generate print view.</div>;
  }

  return (
    <>
      {/* This section will be hidden on print */}
      <div className="py-4 px-6 bg-muted print:hidden">
        <div className="container mx-auto max-w-4xl flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href={`/box/${box.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Box Details
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Print Preview: Box #{box.id.substring(0,8)}</h1>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print This Page
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="container mx-auto max-w-2xl p-4 sm:p-8 bg-white text-black"> {/* Ensure white background for printing */}
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact; /* Chrome, Safari */
              print-color-adjust: exact; /* Firefox */
              margin: 0;
              padding: 0;
              background-color: white !important; /* Override global background for printing */
            }
            .printable-area {
              margin: 20mm; /* Standard margin for printing */
              border: 1px solid #ccc; /* Optional border for the content area */
              padding: 10mm;
              box-shadow: none;
            }
            .print-header, .print-footer {
              display: none; /* Hide app header/footer when printing */
            }
          }
        `}</style>
        <div className="printable-area border border-gray-300 p-6 sm:p-10 rounded-lg shadow-lg print:shadow-none print:border-none print:p-0">
          <header className="mb-8 text-center border-b pb-6 border-gray-300">
            <h1 className="text-4xl font-bold text-primary">MoveAssist - Box Inventory</h1>
            <p className="text-lg text-muted-foreground">Box ID: <span className="font-mono font-semibold text-foreground">{box.id.substring(0,8)}</span></p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code mr-2 h-6 w-6"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M16 21v-3a2 2 0 0 0-2-2h-3"/><path d="M3 8h3a2 2 0 0 0 2-2V3"/><path d="M8 3v3a2 2 0 0 0 2 2h3"/></svg>
                 QR Code
              </h2>
              <div className="p-4 border border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center aspect-square max-w-[200px] mx-auto md:mx-0 bg-white">
                <QRCodeCanvas
                  value={box.qrCodeValue}
                  size={160} // Adjust size as needed
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"} // Error correction level
                  includeMargin={false}
                  imageSettings={{ // Optional: embed an image in the QR code
                    // src: "/path/to/your/logo.png",
                    // height: 30,
                    // width: 30,
                    excavate: true,
                  }}
                />
                <p className="text-sm font-mono text-center text-gray-600 mt-2">Value: {box.qrCodeValue.substring(0,8)}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center"><MapPin className="mr-2 h-6 w-6" /> Destination Room</h2>
              <p className="text-3xl font-bold text-gray-700 bg-gray-100 p-4 rounded-md text-center">
                {box.assignedRoom || <span className="italic text-gray-500">Not Assigned</span>}
              </p>
               {box.suggestedRoom && box.suggestedRoom !== box.assignedRoom && (
                <p className="text-sm text-gray-500 mt-2 text-center">AI Suggestion: {box.suggestedRoom}</p>
              )}
            </div>
          </section>

          {box.photoDataUrl && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3 text-primary">Photo of Contents</h2>
              <div className="border border-gray-300 rounded-md overflow-hidden p-2 bg-gray-50">
                <Image
                  src={box.photoDataUrl}
                  alt={`Contents of box ${box.id}`}
                  width={700}
                  height={450}
                  className="rounded object-contain w-full max-h-[450px]"
                  data-ai-hint="moving box items"
                />
              </div>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center"><Package className="mr-2 h-6 w-6" />Tagged Items</h2>
            {box.aiGeneratedTags && box.aiGeneratedTags.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700 text-lg">
                {box.aiGeneratedTags.map((tag, index) => (
                  <li key={index}>{tag}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">No items tagged by AI.</p>
            )}
          </section>

          {box.manualDescription && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center"><Info className="mr-2 h-6 w-6" />Manual Notes</h2>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{box.manualDescription}</p>
              </div>
            </section>
          )}

          <section className="pt-6 border-t border-gray-300 text-sm text-gray-500">
             <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Date Created: {new Date(box.createdAt).toLocaleDateString()} {new Date(box.createdAt).toLocaleTimeString()}</p>
             <p className="mt-4 text-center">Thank you for using MoveAssist!</p>
          </section>
        </div>
      </div>
    </>
  );
}
