export interface PDFItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  status: 'validating' | 'valid' | 'error';
  errorMessage?: string;
  errorType?: 'encrypted' | 'corrupt' | 'empty' | 'not-pdf' | 'unknown';
  previewUrl?: string;
  thumbnailUrl?: string;
  thumbnailStatus?: 'loading' | 'loaded' | 'error';
  thumbnailDimensions?: { width: number; height: number };
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    dimensions?: { width: number; height: number };
  };
}

export interface MergeProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  stage: string;
  currentFileName?: string;
}

export interface MergeResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  mergedAt: Date;
  inputFilesCount: number;
}
