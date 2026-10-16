import React, { useState } from 'react';
import { PDFItem } from '../types/pdf';
import { FileCard } from './FileCard';
import { DropZone } from './DropZone';
import { AlertCircle } from 'lucide-react';

interface FileListProps {
  items: PDFItem[];
  onReorder: (newItems: PDFItem[]) => void;
  onRemove: (id: string) => void;
  onPreview: (item: PDFItem) => void;
  onFilesSelected: (files: File[]) => void;
  onRemoveInvalidFiles: () => void;
  onRetryThumbnail?: (item: PDFItem) => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  onReorder,
  onRemove,
  onPreview,
  onFilesSelected,
  onRemoveInvalidFiles,
  onRetryThumbnail,
  disabled = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const errorItems = items.filter((i) => i.status === 'error');

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (disabled) return;
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== targetIndex) {
      setDropTargetIndex(targetIndex);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const newItems = [...items];
    const [moved] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    onReorder(newItems);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex || toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    onReorder(newItems);
  };

  return (
    <div className="space-y-4">
      {/* Warning banner if invalid files detected */}
      {errorItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>{errorItems.length}</strong> {errorItems.length === 1 ? 'file has' : 'files have'} errors and will be omitted from the output.
            </span>
          </div>
          <button
            type="button"
            onClick={onRemoveInvalidFiles}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
          >
            Remove Invalid Files
          </button>
        </div>
      )}

      {/* Responsive Document Grid (1-2 mobile, 2-3 tablet, 3-4 desktop) */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        role="region"
        aria-label="Uploaded PDF documents grid"
      >
        {items.map((item, index) => (
          <FileCard
            key={item.id}
            item={item}
            index={index}
            totalItems={items.length}
            onRemove={onRemove}
            onPreview={onPreview}
            onMove={handleMove}
            onRetryThumbnail={onRetryThumbnail}
            disabled={disabled}
            isDragging={draggedIndex === index}
            isDropTarget={dropTargetIndex === index && draggedIndex !== index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Compact Upload Zone below grid */}
      <DropZone
        compact
        onFilesSelected={onFilesSelected}
        disabled={disabled}
      />
    </div>
  );
};
