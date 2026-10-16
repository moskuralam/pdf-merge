import React from 'react';
import {
  FileText,
  Trash2,
  Eye,
  AlertTriangle,
  Lock,
  FileX,
  FileQuestion,
  Loader2,
} from 'lucide-react';
import { PDFItem } from '../types/pdf';
import { formatBytes } from '../utils/download';

interface FileCardProps {
  item: PDFItem;
  index: number;
  totalItems: number;
  onRemove: (id: string) => void;
  onPreview: (item: PDFItem) => void;
  onMove?: (fromIndex: number, toIndex: number) => void;
  onRetryThumbnail?: (item: PDFItem) => void;
  disabled?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  item,
  index,
  totalItems,
  onRemove,
  onPreview,
  onMove,
  onRetryThumbnail,
  disabled = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const isError = item.status === 'error';
  const isValidating = item.status === 'validating';
  const isThumbLoading = item.thumbnailStatus === 'loading' || (isValidating && !item.thumbnailUrl);
  const isThumbLoaded = item.thumbnailStatus === 'loaded' && !!item.thumbnailUrl;

  const getErrorIcon = () => {
    switch (item.errorType) {
      case 'encrypted':
        return <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />;
      case 'empty':
        return <FileX className="w-6 h-6 text-rose-600 flex-shrink-0" />;
      case 'not-pdf':
        return <FileQuestion className="w-6 h-6 text-rose-600 flex-shrink-0" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isError) return;
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && index > 0) {
      e.preventDefault();
      onMove?.(index, index - 1);
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && index < totalItems - 1) {
      e.preventDefault();
      onMove?.(index, index + 1);
    }
  };

  return (
    <div
      role="listitem"
      tabIndex={disabled || isError ? -1 : 0}
      onKeyDown={handleKeyDown}
      draggable={!disabled && !isError}
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      onDragEnd={onDragEnd}
      aria-label={`File ${index + 1} of ${totalItems}: ${item.name}. Use arrow keys to change merge sequence.`}
      className={`group relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-150 p-3 select-none focus:outline-none focus:ring-2 focus:ring-[#3478F6]/50 ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-[#3478F6] shadow-md cursor-grabbing'
          : isDropTarget
          ? 'border-[#3478F6] ring-2 ring-[#3478F6]/30 shadow-sm cursor-grabbing scale-[1.01]'
          : isError
          ? 'border-rose-200 bg-rose-50/20 cursor-default'
          : 'border-[#E6EAF0] hover:border-[#3478F6]/40 hover:shadow-2xs cursor-grab active:cursor-grabbing'
      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* 1. Large Thumbnail (160–220px tall on desktop) */}
      <div
        className={`w-full h-[180px] sm:h-[200px] rounded-xl border flex items-center justify-center overflow-hidden mb-3 relative shadow-2xs transition-colors ${
          isError
            ? 'bg-rose-50/40 border-rose-200'
            : 'bg-white border-[#E6EAF0]'
        }`}
      >
        {isThumbLoaded ? (
          <div className="w-full h-full p-2 flex items-center justify-center bg-white relative">
            {/* Real rendered page 1 canvas image */}
            <img
              src={item.thumbnailUrl}
              alt={`Thumbnail of ${item.name}`}
              className="max-h-full max-w-full object-contain rounded-sm drop-shadow-2xs pointer-events-none"
              loading="lazy"
              onError={() => {
                onRetryThumbnail?.(item);
              }}
            />

            {/* Discrete order and page indicator badges */}
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-[#292D32] border border-[#E6EAF0] shadow-2xs pointer-events-none">
              #{index + 1}
            </span>

            <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#292D32]/85 text-white shadow-xs pointer-events-none">
              {item.pageCount ? `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}` : 'PDF'}
            </span>
          </div>
        ) : isThumbLoading ? (
          /* Neutral loading skeleton */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#F9FBFC] animate-pulse p-4">
            <Loader2 className="w-5 h-5 text-[#3478F6] animate-spin" />
            <span className="text-xs text-[#858B92] font-medium text-center">
              Rendering preview...
            </span>
          </div>
        ) : isError ? (
          /* Error fallback */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-rose-50/40">
            {getErrorIcon()}
            <span className="text-xs font-semibold text-rose-700 leading-tight">
              {item.errorType === 'encrypted' ? 'Password Protected' : 'Validation Error'}
            </span>
            <span className="text-[10px] text-rose-500 line-clamp-2 max-w-[140px]">
              {item.errorMessage || 'Cannot preview file'}
            </span>
          </div>
        ) : (
          /* Fallback when rendering is not available */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#F9FBFC] p-3 text-center">
            <FileText className="w-8 h-8 text-[#3478F6]" />
            <span className="text-xs text-[#858B92]">Preview unavailable</span>
          </div>
        )}
      </div>

      {/* Footer bar with: 2. PDF filename, 3. Eye/view icon button, 4. Delete/trash icon button (no divider line) */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* 2. PDF Filename */}
        <div className="min-w-0 flex-1">
          <h4
            className="text-xs sm:text-sm font-semibold text-[#292D32] truncate"
            title={item.name}
          >
            {item.name}
          </h4>
          <p className="text-[11px] text-[#858B92] truncate mt-0.5">
            {formatBytes(item.size)}
          </p>
        </div>

        {/* Action buttons: 3. View / Eye button, 4. Delete / Trash button */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* 3. Eye/view icon button (Color matches delete/trash icon color #858B92) */}
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
            disabled={isError}
            title="Preview complete PDF"
            aria-label={`Preview ${item.name}`}
            className="p-1.5 rounded-lg text-[#858B92] hover:text-[#3478F6] hover:bg-[#EBF2FE] border border-[#E6EAF0] hover:border-[#3478F6]/30 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* 4. Delete/trash icon button (Always visible) */}
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            disabled={disabled}
            title="Delete file"
            aria-label={`Delete ${item.name}`}
            className="p-1.5 rounded-lg text-[#858B92] hover:text-rose-600 hover:bg-rose-50 border border-[#E6EAF0] hover:border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
