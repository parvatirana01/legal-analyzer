"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// `ssr: false` is only valid inside a Client Component
const PdfViewerDynamic = dynamic(
  () => import("./pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    ),
  }
);

interface PdfViewerClientProps {
  signedUrl: string;
  fileName?: string;
}

export function PdfViewerClient({ signedUrl, fileName }: PdfViewerClientProps) {
  return <PdfViewerDynamic signedUrl={signedUrl} fileName={fileName} />;
}

