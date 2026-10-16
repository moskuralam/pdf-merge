import React from 'react';
import { Layers } from 'lucide-react';

interface MergeControlsProps {
  validFilesCount: number;
  totalFilesCount: number;
  totalPagesCount: number;
  isMerging: boolean;
  onMerge: () => void;
}

export const MergeControls: React.FC<MergeControlsProps> = ({
  validFilesCount,
  totalFilesCount,
  totalPagesCount,
  isMerging,
  onMerge,
}) => {
  const canMerge = validFilesCount >= 2 && !isMerging;

  return (
    <div className="bg-white rounded-2xl border border-[#E6EAF0] p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Row 1: Documents to merge */}
      <div className="flex items-center justify-between text-sm py-1 border-b border-[#E6EAF0]/70">
        <span className="text-[#858B92] font-medium">Documents to merge</span>
        <span className="text-[#292D32] font-bold">
          {validFilesCount} of {totalFilesCount}
        </span>
      </div>

      {/* Row 2: Total combined pages */}
      <div className="flex items-center justify-between text-sm py-1 border-b border-[#E6EAF0]/70">
        <span className="text-[#858B92] font-medium">Total combined pages</span>
        <span className="text-[#292D32] font-bold">
          {totalPagesCount} {totalPagesCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* Primary Action Button: "Merge PDF" */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onMerge}
          disabled={!canMerge}
          className={`w-full py-3 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-2xs transition-all duration-150 ${
            canMerge
              ? 'bg-[#3478F6] hover:bg-[#2566E2] active:bg-[#1E56C8] text-white cursor-pointer hover:shadow-sm'
              : 'bg-[#F0F4F8] text-[#858B92] border border-[#E6EAF0] cursor-not-allowed'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isMerging ? 'Merging PDF...' : 'Merge PDF'}</span>
        </button>

        {!canMerge && !isMerging && (
          <p className="mt-2 text-center text-xs text-[#858B92]">
            {totalFilesCount === 0
              ? 'Add at least 2 PDF documents to begin'
              : validFilesCount < 2
              ? 'At least 2 valid PDF documents are required'
              : ''}
          </p>
        )}
      </div>
    </div>
  );
};
