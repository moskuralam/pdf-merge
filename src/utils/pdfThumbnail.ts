import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker using Vite asset URL
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ThumbnailResult {
  url: string;
  width: number;
  height: number;
}

// In-memory cache for generated thumbnails keyed by file metadata
const thumbnailCache = new Map<string, ThumbnailResult>();

export function getThumbnailCacheKey(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}

/**
 * Generates an actual visual thumbnail image of page 1 of a PDF file using PDF.js.
 * Caches results in memory and returns a resilient data URL or object URL.
 */
export async function generatePdfThumbnail(
  file: File,
  forceRefresh = false
): Promise<ThumbnailResult> {
  const cacheKey = getThumbnailCacheKey(file);

  if (!forceRefresh && thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false,
    useSystemFonts: true,
  });

  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  let page: pdfjsLib.PDFPageProxy | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages < 1) {
      throw new Error('PDF has 0 pages');
    }

    page = await pdfDoc.getPage(1);

    // Compute appropriate resolution for thumbnail (target width ~320px for crisp retina display)
    const initialViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 320;
    const scale = Math.max(0.3, Math.min(2.5, targetWidth / initialViewport.width));
    const viewport = page.getViewport({ scale });

    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Default white background for transparent pages
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render page into canvas
    // Cast to any because pdfjs-dist RenderParameters differs slightly across minor versions
    const renderContext: any = {
      canvasContext: context,
      viewport,
      intent: 'display',
    };

    await page.render(renderContext).promise;

    // Convert to compact JPEG Data URL (completely immune to premature object URL revocation)
    let url: string;
    try {
      url = canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      // Fallback to Blob object URL if toDataURL fails
      const blob = await new Promise<Blob | null>((resolve) => {
        if (!canvas) {
          resolve(null);
          return;
        }
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
      });

      if (!blob) {
        throw new Error('Failed to create thumbnail image blob');
      }

      url = URL.createObjectURL(blob);
    }

    const result: ThumbnailResult = {
      url,
      width: canvas.width,
      height: canvas.height,
    };

    thumbnailCache.set(cacheKey, result);
    return result;
  } finally {
    // Explicit resource cleanup
    if (page) {
      try {
        page.cleanup();
      } catch {
        // Ignore cleanup error
      }
    }
    if (pdfDoc) {
      try {
        pdfDoc.cleanup();
        (pdfDoc as any).destroy?.();
      } catch {
        // Ignore destroy error
      }
    }
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
