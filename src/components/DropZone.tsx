import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus2, Check, ShieldCheck, FileText } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  disabled = false,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Upload more PDF files"
        className={`border border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 text-sm font-medium ${
          isDragOver
            ? 'border-[#3478F6] bg-[#EBF2FE]/60 text-[#3478F6]'
            : 'border-[#E6EAF0] hover:border-[#3478F6] bg-white hover:bg-[#F9FBFC] text-[#292D32]'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="w-8 h-8 rounded-lg bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center">
          <FilePlus2 className="w-4 h-4" />
        </div>
        <span className="text-xs sm:text-sm font-semibold">
          Add more PDF documents (drag &amp; drop or click to browse)
        </span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Drop PDF files here or click to select"
      className={`group relative rounded-2xl border transition-all duration-200 py-8 sm:py-10 px-6 sm:px-8 text-center cursor-pointer select-none bg-white focus:outline-none focus:ring-4 focus:ring-[#3478F6]/15 w-full box-border ${
        isDragOver
          ? 'border-[#3478F6] bg-[#F0F5FF] shadow-sm'
          : 'border-[#E6EAF0] hover:border-[#3478F6]/60 shadow-2xs'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center max-w-[620px] mx-auto w-full">
        {/* Pale blue square icon container matching visual reference */}
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3.5 transition-transform duration-200 group-hover:scale-105 ${
            isDragOver ? 'bg-[#3478F6] text-white shadow-xs' : 'bg-[#EBF2FE] text-[#3478F6]'
          }`}
        >
          <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-[#292D32] mb-1 tracking-tight">
          {isDragOver ? 'Drop files to upload' : 'Drag & drop PDF files here'}
        </h3>
        <p className="text-xs sm:text-sm text-[#858B92] mb-4">
          or choose documents directly from your device storage
        </p>

        {/* Primary vivid blue button */}
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#3478F6] hover:bg-[#2566E2] active:bg-[#1E56C8] shadow-xs transition-all">
          <FileText className="w-4 h-4" />
          <span>Select PDF files</span>
        </div>

        {/* Subtle supporting attributes: single horizontal row on desktop/tablet */}
        <div className="mt-5 flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#858B92] border-t border-[#E6EAF0] pt-4 w-full">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-[#3478F6] shrink-0" />
            PDF format (.pdf)
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-[#3478F6] shrink-0" />
            Multiple files supported
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3478F6] shrink-0" />
            Processed 100% locally
          </span>
        </div>
      </div>
    </div>
  );
};
