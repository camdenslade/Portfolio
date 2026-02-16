'use client';

import dynamic from 'next/dynamic';

const PdfEditorApp = dynamic(
  () => import('@/components/pdf-editor/PdfEditorApp').then((m) => ({ default: m.PdfEditorApp })),
  { ssr: false }
);

export default function PdfEditorPage() {
  return <PdfEditorApp />;
}
