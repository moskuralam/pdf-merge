/**
 * Cross-browser file download helper with fallbacks for Mobile Safari,
 * Samsung Internet, Edge, Chrome, and Firefox.
 */

export function triggerDownload(blob: Blob, filename: string): void {
  // Safe filename cleanup
  const safeName = filename.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'merged-document.pdf';

  // Check for msSaveOrOpenBlob (legacy Edge / IE if applicable)
  const nav = window.navigator as unknown as {
    msSaveOrOpenBlob?: (blob: Blob, filename: string) => boolean;
  };
  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, safeName);
    return;
  }

  // Create temporary object URL
  const blobUrl = URL.createObjectURL(blob);

  // Standard HTML5 download attribute
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = safeName;
  link.rel = 'noopener';
  link.target = '_blank'; // Helpful fallback on mobile webkit if download attribute is suppressed
  link.style.display = 'none';

  document.body.appendChild(link);

  try {
    link.click();
  } catch (err) {
    // If click dispatch fails, open directly in a new window/tab
    console.warn('Programmatic click download failed, attempting window.open fallback:', err);
    window.open(blobUrl, '_blank');
  }

  // Clean up object URL after a safe delay
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    // We do not immediately revoke blobUrl here if the user might still need it in UI,
    // but the caller manages active result URLs.
  }, 2000);
}

/**
 * Checks if the browser Web Share API supports sharing files.
 * Supported on iOS Safari, Android Chrome, and Samsung Internet.
 */
export function canShareFile(file: File): boolean {
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && navigator.canShare) {
    try {
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Shares a PDF file using the native device share sheet (iOS/Android).
 */
export async function sharePdfFile(file: File, title: string = 'Merged PDF Document'): Promise<boolean> {
  if (canShareFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title,
        text: `Here is the merged PDF file: ${file.name}`,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
      return false;
    }
  }
  return false;
}

/**
 * Format bytes to human-readable size string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
