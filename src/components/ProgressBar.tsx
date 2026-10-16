import React from 'react';
import { MergeProgress } from '../types/pdf';
import { Loader2, XCircle } from 'lucide-react';

interface ProgressBarProps {
  progress: MergeProgress;
  onCancel?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, onCancel }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress.percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="PDF Merge Progress"
      className="bg-white rounded-2xl border border-[#E6EAF0] p-5 shadow-2xs space-y-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Loader2 className="w-4 h-4 text-[#3478F6] animate-spin flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#292D32] truncate">
              {progress.stage}
            </h4>
            {progress.currentFileName && (
              <p className="text-[11px] text-[#858B92] truncate">
                {progress.currentFileName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-[#3478F6]">
            {progress.percentage}%
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              title="Cancel merge"
              className="p-1 text-[#858B92] hover:text-rose-600 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress track in vibrant blue */}
      <div className="w-full bg-[#EBF2FE] rounded-full h-2 overflow-hidden">
        <div
          className="bg-[#3478F6] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(6, progress.percentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#858B92]">
        <span>Step {progress.currentStep} of {progress.totalSteps}</span>
        <span>Local in-memory assembly</span>
      </div>
    </div>
  );
};
