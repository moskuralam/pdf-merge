import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { MergeResult } from '../types/pdf';
import { formatBytes, triggerDownload } from '../utils/download';
import {
  Download,
  ArrowLeft,
  FileText,
  Layers,
  Loader2,
  AlertCircle,
  Edit2,
  Check,
} from 'lucide-react';

interface ResultViewProps {
  result: MergeResult;
  onBackToEdit: () => void;
  onResetAll: () => void;
}

interface PageRendererProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  totalCount: number;
}

const PageRenderer: React.FC<PageRendererProps> = ({ pdfDoc, pageNumber, totalCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let activeRenderTask: any = null;
    let isCancelled = false;

    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (isCancelled || !canvasRef.current) return;

        // Render at 1.5x scale for sharp text and graphics
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Responsive display sizing
        canvas.style.width = '100%';
        canvas.style.maxWidth = `${Math.floor(viewport.width / scale)}px`;
        canvas.style.height = 'auto';

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext: any = {
          canvasContext: ctx,
          viewport,
        };

        activeRenderTask = page.render(renderContext);
        return activeRenderTask.promise;
      })
      .then(() => {
        if (!isCancelled) {
          setIsRendered(true);
        }
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'RenderingCancelledException' && !isCancelled) {
          setRenderError((err as Error)?.message || 'Failed to render page');
        }
      });

    return () => {
      isCancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Compact Page Indicator */}
      <div className="mb-2 px-3 py-0.5 rounded-full bg-white border border-[#E6EAF0] text-[11px] font-semibold text-[#858B92] shadow-2xs">
        Page {pageNumber} of {totalCount}
      </div>

      {/* Page Canvas Card */}
      <div className="bg-white rounded-lg border border-[#E6EAF0] shadow-sm overflow-hidden flex items-center justify-center p-1 sm:p-2 relative min-h-[300px] w-full max-w-[680px]">
        {!isRendered && !renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F9FBFC] gap-2">
            <Loader2 className="w-5 h-5 text-[#3478F6] animate-spin" />
            <span className="text-xs text-[#858B92]">Rendering page {pageNumber}...</span>
          </div>
        )}

        {renderError ? (
          <div className="p-6 text-center text-rose-600 text-xs">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-500" />
            {renderError}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`transition-opacity duration-200 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  onBackToEdit,
}) => {
  const [fileName, setFileName] = useState(result.fileName || 'merged-document.pdf');
  const [isEditingName, setIsEditingName] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  // PDF.js document state for complete multi-page preview
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;
    setLoadingPdf(true);
    setLoadError(null);

    result.blob
      .arrayBuffer()
      .then((buffer) => {
        if (isCancelled) return null;
        const task = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          stopAtErrors: false,
          useSystemFonts: true,
        });
        return task.promise;
      })
      .then((doc) => {
        if (!doc) return;
        if (isCancelled) {
          doc.cleanup();
          (doc as any).destroy?.();
          return;
        }
        loadedDoc = doc;
        setPdfDoc(doc);
        setLoadingPdf(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          setLoadError((err as Error)?.message || 'Failed to render merged PDF preview');
          setLoadingPdf(false);
        }
      });

    return () => {
      isCancelled = true;
      if (loadedDoc) {
        try {
          loadedDoc.cleanup();
          (loadedDoc as any).destroy?.();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [result.blob]);

  const handleDownload = () => {
    const finalName = fileName.trim().toLowerCase().endsWith('.pdf')
      ? fileName.trim()
      : `${fileName.trim()}.pdf`;
    triggerDownload(result.blob, finalName);
    setDownloadCount((prev) => prev + 1);
  };

  const pageNumbers = pdfDoc ? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1) : [];

  return (
    <div className="space-y-4">
      {/* Two-Column Responsive Layout:
          Left: Full merged PDF preview (approx 65-70%)
          Right: Download details card (approx 30-35%)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Full Merged PDF Preview */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6EAF0] overflow-hidden shadow-2xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-[#E6EAF0] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3478F6]" />
              <h3 className="text-xs font-bold text-[#292D32] uppercase tracking-wider">
                Full Document Preview
              </h3>
            </div>
            <span className="text-xs text-[#858B92]">
              {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} total
            </span>
          </div>

          <div className="bg-[#F4F6F8] p-4 sm:p-6 overflow-y-auto max-h-[82vh] min-h-[500px]">
            {loadingPdf && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-[#3478F6] animate-spin" />
                <p className="text-sm font-semibold text-[#292D32]">Loading document preview...</p>
                <p className="text-xs text-[#858B92]">Rendering all pages in document order</p>
              </div>
            )}

            {loadError && (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-rose-600">
                <AlertCircle className="w-7 h-7 text-rose-500" />
                <p className="text-sm font-semibold">{loadError}</p>
                <p className="text-xs text-[#858B92]">You can still download the merged file on the right.</p>
              </div>
            )}

            {!loadingPdf && !loadError && pdfDoc && (
              <div className="flex flex-col items-center space-y-6 pb-4">
                {pageNumbers.map((num) => (
                  <PageRenderer
                    key={num}
                    pdfDoc={pdfDoc}
                    pageNumber={num}
                    totalCount={pdfDoc.numPages}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Download Details Card */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-3xl border border-[#E6EAF0] p-6 shadow-2xs space-y-5">
            {/* Title communicates success state directly without green checkmark or badge */}
            <div>
              <h3 className="text-lg font-bold text-[#292D32] tracking-tight">
                Your merged PDF is ready
              </h3>
            </div>

            {/* Document Details List */}
            <div className="bg-[#F9FBFC] rounded-2xl border border-[#E6EAF0] p-4 space-y-3 text-xs">
              {/* Output Filename */}
              <div>
                <div className="flex items-center justify-between text-[#858B92] mb-1">
                  <span>File name</span>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-[#3478F6] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      Rename
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs font-semibold text-[#292D32] bg-white border border-[#3478F6] rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="font-bold text-[#292D32] truncate" title={fileName}>
                    {fileName}
                  </p>
                )}
              </div>

              {/* Actual Total Page Count */}
              <div className="flex items-center justify-between text-[#858B92]">
                <span>Total pages</span>
                <span className="font-bold text-[#292D32] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#3478F6]" />
                  {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>

              {/* Actual Output File Size */}
              <div className="flex items-center justify-between text-[#858B92]">
                <span>File size</span>
                <span className="font-bold text-[#292D32]">
                  {formatBytes(result.fileSize)}
                </span>
              </div>
            </div>

            {/* Primary Blue Button: Download PDF (Visually Dominant) */}
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-[#3478F6] hover:bg-[#2566E2] active:bg-[#1E56C8] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer scale-100 hover:scale-[1.01]"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
              {downloadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                  {downloadCount}
                </span>
              )}
            </button>

            {/* Secondary Action: Back to documents / Merge more PDFs */}
            <button
              type="button"
              onClick={onBackToEdit}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-[#292D32] hover:bg-[#F9FBFC] border border-[#E6EAF0] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#858B92]" />
              <span>Back to documents</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
