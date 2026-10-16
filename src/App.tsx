/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFItem, MergeProgress, MergeResult } from './types/pdf';
import { validatePdfFile } from './utils/pdfValidator';
import { mergePdfs } from './utils/pdfMerger';
import { createSamplePdfs, createCorruptedTestFile, createEmptyTestFile } from './utils/samplePdfs';
import { generatePdfThumbnail, clearThumbnailCache } from './utils/pdfThumbnail';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { MergeControls } from './components/MergeControls';
import { MergeLoadingView } from './components/MergeLoadingView';
import { ResultView } from './components/ResultView';
import { PreviewModal } from './components/PreviewModal';
import { BrowserCompatInfo } from './components/BrowserCompatInfo';
import { AlertCircle, X, Shield, Zap, Sparkles, Layers, RotateCcw } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<PDFItem[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>('merged-document.pdf');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeProgress, setMergeProgress] = useState<MergeProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [previewItem, setPreviewItem] = useState<PDFItem | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const itemsRef = useRef<PDFItem[]>(items);
  itemsRef.current = items;

  // Revoke merged result blob URL only when mergeResult is replaced or cleared
  useEffect(() => {
    const currentUrl = mergeResult?.url;
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [mergeResult]);

  // Revoke any blob thumbnails only when App unmounts entirely
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.thumbnailUrl && item.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbnailUrl);
        }
      });
    };
  }, []);

  const activeThumbnailGenerations = useRef<Set<string>>(new Set());

  // Function to generate or restore thumbnail for an item
  const renderItemThumbnail = useCallback(async (item: PDFItem, forceRefresh = false) => {
    if (activeThumbnailGenerations.current.has(item.id)) return;
    activeThumbnailGenerations.current.add(item.id);

    try {
      const thumb = await generatePdfThumbnail(item.file, forceRefresh);
      setItems((currentItems) =>
        currentItems.map((curr) =>
          curr.id === item.id
            ? {
                ...curr,
                thumbnailUrl: thumb.url,
                thumbnailStatus: 'loaded',
                thumbnailDimensions: { width: thumb.width, height: thumb.height },
              }
            : curr
        )
      );
    } catch (thumbErr) {
      console.warn(`Thumbnail rendering failed for "${item.name}":`, thumbErr);
      setItems((currentItems) =>
        currentItems.map((curr) =>
          curr.id === item.id
            ? {
                ...curr,
                thumbnailStatus: 'error',
              }
            : curr
        )
      );
    } finally {
      activeThumbnailGenerations.current.delete(item.id);
    }
  }, []);

  // When returning to the document list from results view or after upload, ensure all valid items have active thumbnails
  useEffect(() => {
    if (mergeResult || isMerging || items.length === 0) return;

    items.forEach((item) => {
      if (
        item.status === 'valid' &&
        (!item.thumbnailUrl || item.thumbnailStatus !== 'loaded') &&
        !activeThumbnailGenerations.current.has(item.id)
      ) {
        renderItemThumbnail(item);
      }
    });
  }, [mergeResult, isMerging, items, renderItemThumbnail]);

  const handleRetryThumbnail = useCallback(
    (item: PDFItem) => {
      renderItemThumbnail(item, true);
    },
    [renderItemThumbnail]
  );

  // Add files to state and validate each asynchronously
  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      if (!newFiles || newFiles.length === 0) return;
      setErrorNotification(null);

      const rejectedErrors: string[] = [];
      const validItemsToAdd: PDFItem[] = [];

      // Check current items to detect duplicate selections
      const existingSignatures = new Set(
        itemsRef.current.map((it) => `${it.file.name}_${it.file.size}_${it.file.lastModified}`)
      );
      const batchSignatures = new Set<string>();

      for (const file of newFiles) {
        const fileSig = `${file.name}_${file.size}_${file.lastModified}`;

        // Duplicate check
        if (existingSignatures.has(fileSig) || batchSignatures.has(fileSig)) {
          rejectedErrors.push(`"${file.name}" is already in the document list.`);
          continue;
        }
        batchSignatures.add(fileSig);

        try {
          const validation = await validatePdfFile(file);

          if (validation.status === 'valid') {
            const newItem: PDFItem = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              file,
              name: file.name,
              size: file.size,
              pageCount: validation.pageCount,
              status: 'valid',
              thumbnailStatus: 'loading',
              metadata: validation.metadata,
            };
            validItemsToAdd.push(newItem);
          } else {
            rejectedErrors.push(
              validation.errorMessage || `"${file.name}" is not a valid PDF document.`
            );
          }
        } catch {
          rejectedErrors.push(`"${file.name}" could not be read or parsed.`);
        }
      }

      if (rejectedErrors.length > 0) {
        setErrorNotification(rejectedErrors.join(' '));
      }

      if (validItemsToAdd.length > 0) {
        setItems((prev) => [...prev, ...validItemsToAdd]);
        // Trigger thumbnail rendering for each valid item
        for (const item of validItemsToAdd) {
          renderItemThumbnail(item);
        }
      }
    },
    [renderItemThumbnail]
  );

  // Generate 3 sample PDFs for instant 1-click test
  const handleLoadSamples = async () => {
    try {
      setIsLoadingSamples(true);
      setErrorNotification(null);
      const sampleFiles = await createSamplePdfs();
      await handleFilesSelected(sampleFiles);
    } catch {
      setErrorNotification('Could not generate sample PDFs. You can still select your own files.');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Add invalid test files to verify error resilience
  const handleLoadCorruptedTest = async () => {
    const corruptFile = createCorruptedTestFile();
    const emptyFile = createEmptyTestFile();
    await handleFilesSelected([corruptFile, emptyFile]);
  };

  // Clear workspace
  const handleClearAll = () => {
    if (mergeResult?.url && mergeResult.url.startsWith('blob:')) {
      URL.revokeObjectURL(mergeResult.url);
    }
    items.forEach((item) => {
      if (item.thumbnailUrl && item.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    });
    clearThumbnailCache();
    setItems([]);
    setMergeResult(null);
    setMergeProgress(null);
    setErrorNotification(null);
  };

  // Remove individual file
  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.thumbnailUrl) {
        URL.revokeObjectURL(target.thumbnailUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Remove invalid/errored files in one click
  const handleRemoveInvalidFiles = () => {
    setItems((prev) => {
      prev.filter((i) => i.status === 'error').forEach((i) => {
        if (i.thumbnailUrl) {
          URL.revokeObjectURL(i.thumbnailUrl);
        }
      });
      return prev.filter((item) => item.status !== 'error');
    });
  };

  // Reorder files
  const handleReorder = (newItems: PDFItem[]) => {
    setItems(newItems);
  };

  // Cancel running merge operation
  const handleCancelMerge = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsMerging(false);
    setMergeProgress(null);
  };

  // Run the merge
  const handleMerge = async () => {
    const validItems = items.filter((i) => i.status === 'valid');
    if (validItems.length < 2) {
      setErrorNotification('Please provide at least 2 valid PDF documents to merge.');
      return;
    }

    if (isMerging) return; // Prevent duplicate concurrent merge jobs

    setIsMerging(true);
    setErrorNotification(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await mergePdfs(validItems, {
        outputFileName,
        onProgress: (p) => setMergeProgress(p),
        signal: controller.signal,
      });

      setMergeResult(result);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setErrorNotification('Merge operation was cancelled.');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setErrorNotification(`Failed to merge PDFs: ${message}`);
      }
    } finally {
      setIsMerging(false);
      setMergeProgress(null);
      abortControllerRef.current = null;
    }
  };

  // Back to edit from result view
  const handleBackToEdit = () => {
    setMergeResult(null);
  };

  const validCount = items.filter((i) => i.status === 'valid').length;
  const gridCount = items.filter((i) => i.status !== 'error').length;
  const gridCountLabel = `${gridCount} ${gridCount === 1 ? 'file' : 'files'} in grid`;
  const totalPages = items
    .filter((i) => i.status === 'valid')
    .reduce((acc, curr) => acc + (curr.pageCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans antialiased text-[#292D32] selection:bg-[#3478F6] selection:text-white">
      {/* Sticky Full-width Top Header */}
      <Header />

      {/* Main Content Workspace: responsive width up to 1440px with 24-40px horizontal padding */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-5">
        {/* Workspace status indicator when files are present */}
        {items.length > 0 && !mergeResult && !isMerging && (
          <div className="flex items-center justify-between pb-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E6EAF0] text-xs font-semibold text-[#292D32] shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#3478F6]" />
              <span>{gridCountLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              title="Clear all uploaded documents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-[#858B92] hover:text-rose-600 hover:bg-rose-50 border border-[#E6EAF0] transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* Global error alert */}
        {errorNotification && (
          <div className="bg-rose-50 border border-rose-200/90 text-rose-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-semibold">{errorNotification}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorNotification(null)}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Mode: Merging Loading Screen OR Results Page OR Document Grid Workspace */}
        {isMerging ? (
          <MergeLoadingView
            progress={mergeProgress}
            validFilesCount={validCount}
            totalPagesCount={totalPages}
            onCancel={handleCancelMerge}
          />
        ) : mergeResult ? (
          <ResultView
            result={mergeResult}
            onBackToEdit={handleBackToEdit}
            onResetAll={handleClearAll}
          />
        ) : (
          <div className="space-y-5">
            {/* Empty state / Initial Upload Card */}
            {items.length === 0 ? (
              <div className="space-y-6 sm:space-y-7">
                {/* Heading & short descriptive paragraph above the upload card */}
                <div className="text-center max-w-[720px] mx-auto px-2 pt-1 sm:pt-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#292D32] tracking-tight leading-tight">
                    Merge PDF Files Online for Free
                  </h1>
                  <p className="mt-2.5 sm:mt-3 text-sm sm:text-[15.5px] lg:text-[16px] text-[#858B92] leading-relaxed max-w-[720px] mx-auto">
                    Combine multiple PDF documents into one file in seconds. Easily arrange your files, preview your documents, and download your merged PDF — all processed securely on your device.
                  </p>
                </div>

                {/* Centered Upload Card with responsive max-width of 720px on desktop */}
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-[720px] box-border">
                    <DropZone
                      onFilesSelected={handleFilesSelected}
                      disabled={isMerging}
                    />
                  </div>
                </div>

                {/* 3 Reference Feature Cards styled cleanly and spanning full container width */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6EAF0] shadow-2xs flex items-start gap-4 sm:gap-4.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#292D32]">
                        100% Private &amp; Offline
                      </h4>
                      <p className="text-xs text-[#858B92] leading-relaxed">
                        Documents stay completely on your computer or device. No external servers or uploads.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6EAF0] shadow-2xs flex items-start gap-4 sm:gap-4.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#292D32]">
                        Drag-and-Drop Reordering
                      </h4>
                      <p className="text-xs text-[#858B92] leading-relaxed">
                        Easily arrange document sequences with visual drag handles and accessible keyboard controls.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6EAF0] shadow-2xs flex items-start gap-4 sm:gap-4.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#292D32]">
                        Cross-Browser Standard
                      </h4>
                      <p className="text-xs text-[#858B92] leading-relaxed">
                        Optimized memory footprint built for Chrome, Edge, Safari, Firefox, and Samsung Internet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Uploaded Files Workspace: Responsive Grid + Simplified Summary Panel */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                {/* Left Area: Responsive Document Grid */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                  <FileList
                    items={items}
                    onReorder={handleReorder}
                    onRemove={handleRemove}
                    onPreview={(item) => setPreviewItem(item)}
                    onFilesSelected={handleFilesSelected}
                    onRemoveInvalidFiles={handleRemoveInvalidFiles}
                    onRetryThumbnail={handleRetryThumbnail}
                    disabled={isMerging}
                  />
                </div>

                {/* Right Area: Simplified Merge Summary Panel */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20">
                  <MergeControls
                    validFilesCount={validCount}
                    totalFilesCount={items.length}
                    totalPagesCount={totalPages}
                    isMerging={isMerging}
                    onMerge={handleMerge}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#E6EAF0] py-4 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 text-center">
          <p className="text-xs text-[#858B92]">
            Copyright © 2026 PDF Merge. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Preview Modal */}
      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
