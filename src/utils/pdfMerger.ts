import { PDFDocument } from 'pdf-lib';
import { PDFItem, MergeProgress, MergeResult } from '../types/pdf';

// Helper to yield control back to the UI thread
const yieldThread = () => new Promise((resolve) => setTimeout(resolve, 10));

export interface MergeOptions {
  outputFileName?: string;
  onProgress?: (progress: MergeProgress) => void;
  signal?: AbortSignal;
}

/**
 * Merges a list of PDFItems into a single PDF document in the specified order.
 * Executes purely in-browser using standard Blob/File APIs and pdf-lib.
 */
export async function mergePdfs(
  items: PDFItem[],
  options: MergeOptions = {}
): Promise<MergeResult> {
  const { outputFileName = 'merged-document.pdf', onProgress, signal } = options;

  // Filter only valid items
  const validItems = items.filter((item) => item.status === 'valid');
  if (validItems.length < 2) {
    throw new Error('At least two valid PDF files are required to merge.');
  }

  // Calculate total pages for granular progress
  const totalPagesCount = validItems.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);
  const totalSteps = validItems.length + 2; // +1 for initialization, +1 for final serialization
  let currentStep = 0;
  let copiedPagesSoFar = 0;

  const report = (stage: string, currentFileName?: string) => {
    if (onProgress) {
      const percentage = Math.min(
        100,
        Math.round((currentStep / totalSteps) * 100)
      );
      onProgress({
        currentStep,
        totalSteps,
        percentage,
        stage,
        currentFileName,
      });
    }
  };

  report('Initializing new merged document...');
  currentStep++;
  await yieldThread();

  if (signal?.aborted) {
    throw new DOMException('Merge operation cancelled by user.', 'AbortError');
  }

  // Create target PDF document
  const mergedPdf = await PDFDocument.create();

  // Set standard metadata
  mergedPdf.setTitle(outputFileName.replace(/\.pdf$/i, ''));
  mergedPdf.setProducer('PDFMerge Studio (pdf-lib)');
  mergedPdf.setCreator('PDFMerge Studio');
  mergedPdf.setCreationDate(new Date());
  mergedPdf.setModificationDate(new Date());

  // Process each document sequentially to conserve browser memory
  for (let i = 0; i < validItems.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Merge operation cancelled by user.', 'AbortError');
    }

    const item = validItems[i];
    report(
      `Processing file ${i + 1} of ${validItems.length}: ${item.name}`,
      item.name
    );
    await yieldThread();

    try {
      // Read binary data from the file
      const arrayBuffer = await item.file.arrayBuffer();

      // Load donor document
      const donorPdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: false,
      });

      const pageIndices = donorPdf.getPageIndices();
      if (pageIndices.length > 0) {
        // Copy all pages into target document
        const copiedPages = await mergedPdf.copyPages(donorPdf, pageIndices);
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          copiedPagesSoFar++;
        }
      }

      currentStep++;
      report(
        `Copied ${donorPdf.getPageCount()} pages from ${item.name}`,
        item.name
      );
      await yieldThread();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to process "${item.name}": ${msg}`);
    }
  }

  // Final step: Save and serialize to Uint8Array
  report('Assembling and compressing final document...');
  currentStep++;
  await yieldThread();

  if (signal?.aborted) {
    throw new DOMException('Merge operation cancelled by user.', 'AbortError');
  }

  const mergedPdfBytes = await mergedPdf.save({
    useObjectStreams: true, // Optimizes file size
  });

  report('Finalizing PDF package...');
  await yieldThread();

  // Create clean Blob
  const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // Ensure output filename ends with .pdf
  const finalName = outputFileName.trim().toLowerCase().endsWith('.pdf')
    ? outputFileName.trim()
    : `${outputFileName.trim()}.pdf`;

  return {
    blob,
    url,
    fileName: finalName,
    fileSize: blob.size,
    pageCount: mergedPdf.getPageCount(),
    mergedAt: new Date(),
    inputFilesCount: validItems.length,
  };
}
