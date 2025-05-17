import { PrintViewClient } from '@/components/PrintViewClient';
import { Button } from '@/components/ui/button'; // Used by PrintViewClient
import { ArrowLeft } from 'lucide-react'; // Used by PrintViewClient
import Link from 'next/link'; // Used by PrintViewClient

interface BoxPrintPageProps {
  params: { id: string };
}

// This page is designed for printing. Layout can be simpler.
// Header/Footer from (main) layout might be hidden via @media print in PrintViewClient or globals.css if needed.
export default async function BoxPrintPage({ params }: BoxPrintPageProps) {
  return (
     <PrintViewClient boxId={params.id} />
  );
}
