"use client";

import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";

// Serve the worker from /public (copied from node_modules/pdfjs-dist/build)
// This avoids CDN availability issues and version mismatches.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PdfViewerProps {
  /** The signed R2 URL (5-min expiry). */
  signedUrl: string;
  /** Document file name — shown while loading */
  fileName?: string;
  /** Called when user requests a fresh signed URL (expiry refresh) */
  onRequestRefresh?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PdfViewer({ signedUrl, fileName, onRequestRefresh }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Measure container for responsive page width
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(node);
      setContainerWidth(node.getBoundingClientRect().width);
    }
  }, []);

  // Block context-menu to hinder right-click "Save as"
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setLoadError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("[PdfViewer] Load error:", error);
    setLoadError(
      error.message.includes("expired") || error.message.includes("403")
        ? "The PDF link has expired. Please refresh."
        : "Failed to load the PDF. Please try again."
    );
  };

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.0, parseFloat((s + 0.25).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))));

  // Compute page render width to fill container
  const pageWidth = Math.max(300, containerWidth - 32) * scale;

  return (
    <div className="flex h-full flex-col bg-[#0d0d14]">
      {/* ── Toolbar ── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/8 bg-[#0a0a0f] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 flex-shrink-0 text-violet-400" />
          <span className="truncate text-sm font-medium text-white/70">
            {fileName ?? "Document"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom */}
          <button
            onClick={zoomOut}
            title="Zoom out"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs text-white/40">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            title="Zoom in"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Page nav */}
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[64px] text-center text-xs text-white/50">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── PDF area ── */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="flex-1 overflow-auto p-4 select-none"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        {loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-white/60">{loadError}</p>
            {onRequestRefresh && (
              <button
                onClick={onRequestRefresh}
                className="flex items-center gap-2 rounded-xl bg-white/8 px-4 py-2 text-sm text-white/70 hover:bg-white/12 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh PDF
              </button>
            )}
          </div>
        ) : (
          <Document
            file={signedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400/50" />
                </div>
              }
              className="shadow-2xl rounded-lg overflow-hidden"
            />
          </Document>
        )}
      </div>
    </div>
  );
}

