import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFItem } from '../types/pdf';
import { X, FileText, Loader2, AlertCircle, Layers } from 'lucide-react';

interface PreviewModalProps {
  item: PDFItem | null;
  onClose: () => void;
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

        // Render at 1.5x scale for sharp, high-DPI text and graphics
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
      {/* Page header indicator */}
      <div className="mb-2 px-2.5 py-0.5 rounded-full bg-white border border-[#E6EAF0] text-[11px] font-semibold text-[#858B92] shadow-2xs">
        Page {pageNumber} of {totalCount}
      </div>

      {/* Page canvas card */}
      <div className="bg-white rounded-lg border border-[#E6EAF0] shadow-sm overflow-hidden flex items-center justify-center p-1 sm:p-2 relative min-h-[300px] w-full max-w-[700px]">
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

export const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (item) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [item]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load complete PDF document with PDF.js
  useEffect(() => {
    if (!item) {
      setPdfDoc(null);
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    let isCancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    item.file
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
        setLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          const msg = (err as Error)?.message || 'Failed to open PDF document';
          setLoadError(msg);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (loadedDoc) {
        try {
          loadedDoc.cleanup();
          (loadedDoc as any).destroy?.();
        } catch {
          // Ignore destroy errors
        }
      }
    };
  }, [item]);

  if (!item) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const pageNumbers = pdfDoc ? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.name}`}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E6EAF0] w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E6EAF0] flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#292D32] truncate" title={item.name}>
                {item.name}
              </h3>
              <p className="text-xs text-[#858B92] flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#3478F6]" />
                <span>
                  {pdfDoc ? `${pdfDoc.numPages} ${pdfDoc.numPages === 1 ? 'page' : 'pages'}` : 'Loading document...'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close PDF preview"
            title="Close (Esc)"
            className="p-2 text-[#858B92] hover:text-[#292D32] hover:bg-[#F9FBFC] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Vertically scrollable multi-page PDF viewer */}
        <div className="flex-1 bg-[#F4F6F8] p-4 sm:p-6 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <Loader2 className="w-8 h-8 text-[#3478F6] animate-spin" />
              <p className="text-sm font-semibold text-[#292D32]">Loading document pages...</p>
              <p className="text-xs text-[#858B92]">Rendering complete PDF with PDF.js</p>
            </div>
          )}

          {loadError && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#292D32]">Cannot Preview Document</h4>
              <p className="text-xs text-[#858B92]">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-[#F0F4F8] hover:bg-slate-200 text-xs font-semibold text-[#292D32] transition-colors"
              >
                Close Preview
              </button>
            </div>
          )}

          {!loading && !loadError && pdfDoc && (
            <div className="flex flex-col items-center space-y-6 pb-6">
              {pageNumbers.map((pageNum) => (
                <PageRenderer
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  totalCount={pdfDoc.numPages}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
