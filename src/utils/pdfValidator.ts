import { PDFDocument } from 'pdf-lib';
import { PDFItem } from '../types/pdf';

/**
 * Checks if the binary buffer starts with or contains the '%PDF-' magic header
 * within the first 1024 bytes, per ISO 32000-1 specification.
 */
async function hasPdfHeader(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 1024);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('ascii').decode(bytes);
    return text.includes('%PDF-');
  } catch {
    return false;
  }
}

/**
 * Validates a PDF file, inspecting its header, parsing its structure,
 * checking for password encryption, and extracting page count and metadata.
 */
export async function validatePdfFile(file: File): Promise<Partial<PDFItem>> {
  // 1. Check for empty file
  if (file.size === 0) {
    return {
      status: 'error',
      errorType: 'empty',
      errorMessage: 'This file is empty (0 bytes). Valid PDF files must contain data.',
    };
  }

  // 1b. Check for oversized files that exceed browser memory capabilities
  if (file.size > 300 * 1024 * 1024) {
    return {
      status: 'error',
      errorType: 'corrupt',
      errorMessage: `"${file.name}" exceeds 300MB. Due to browser memory limits, very large PDFs cannot be processed safely in the browser. Please compress the file before merging.`,
    };
  }

  // 2. Check MIME/extension or header magic bytes
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const hasValidHeader = await hasPdfHeader(file);

  if (!isPdfExtension && !hasValidHeader) {
    return {
      status: 'error',
      errorType: 'not-pdf',
      errorMessage: `"${file.name}" is not a recognized PDF document. Please upload a .pdf file.`,
    };
  }

  if (!hasValidHeader) {
    return {
      status: 'error',
      errorType: 'not-pdf',
      errorMessage: `"${file.name}" does not have a valid PDF signature (%PDF- header missing). It may be renamed or corrupted.`,
    };
  }

  // 3. Attempt to load with pdf-lib to check structure and encryption
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    let pdfDoc: PDFDocument;
    try {
      // First attempt with strict encryption check
      pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
    } catch (loadErr: unknown) {
      const errStr = String(loadErr).toLowerCase();
      if (
        errStr.includes('encrypt') ||
        errStr.includes('password') ||
        errStr.includes('security')
      ) {
        return {
          status: 'error',
          errorType: 'encrypted',
          errorMessage: 'This PDF is password-protected or encrypted. Please remove encryption before merging.',
        };
      }
      throw loadErr;
    }

    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      return {
        status: 'error',
        errorType: 'corrupt',
        errorMessage: 'The PDF has 0 pages or an empty page tree.',
      };
    }

    // Extract metadata safely
    let title: string | undefined;
    let author: string | undefined;
    let creator: string | undefined;
    let producer: string | undefined;
    let creationDate: string | undefined;
    let modificationDate: string | undefined;
    let dimensions: { width: number; height: number } | undefined;

    try {
      title = pdfDoc.getTitle();
      author = pdfDoc.getAuthor();
      creator = pdfDoc.getCreator();
      producer = pdfDoc.getProducer();
      creationDate = pdfDoc.getCreationDate()?.toLocaleDateString();
      modificationDate = pdfDoc.getModificationDate()?.toLocaleDateString();

      const firstPage = pdfDoc.getPage(0);
      const size = firstPage.getSize();
      dimensions = {
        width: Math.round(size.width),
        height: Math.round(size.height),
      };
    } catch {
      // Non-critical metadata read error
    }

    return {
      status: 'valid',
      pageCount,
      metadata: {
        title,
        author,
        creator,
        producer,
        creationDate,
        modificationDate,
        dimensions,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (
      errorMsg.toLowerCase().includes('encrypt') ||
      errorMsg.toLowerCase().includes('password')
    ) {
      return {
        status: 'error',
        errorType: 'encrypted',
        errorMessage: 'This PDF is password-protected. Please unlock it before merging.',
      };
    }

    return {
      status: 'error',
      errorType: 'corrupt',
      errorMessage: `Could not parse PDF: ${errorMsg.slice(0, 120)}. The file may be damaged or truncated.`,
    };
  }
}
