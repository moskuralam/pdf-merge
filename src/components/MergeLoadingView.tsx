import React from 'react';
import { MergeProgress } from '../types/pdf';
import { Layers, CheckCircle2, Loader2, ShieldCheck, FileText } from 'lucide-react';

interface MergeLoadingViewProps {
  progress: MergeProgress | null;
  validFilesCount: number;
  totalPagesCount: number;
  onCancel?: () => void;
}

export const MergeLoadingView: React.FC<MergeLoadingViewProps> = ({
  progress,
  validFilesCount,
  totalPagesCount,
  onCancel,
}) => {
  // Determine actual completed and active stages
  const currentStep = progress?.currentStep || 0;
  const totalSteps = progress?.totalSteps || 3;

  // Stage 1: Preparing documents
  // Stage 2: Combining PDF pages
  // Stage 3: Preparing your download
  const isStage1Complete = currentStep > 1;
  const isStage1Active = currentStep <= 1;

  const isStage2Complete = currentStep >= totalSteps;
  const isStage2Active = currentStep > 1 && currentStep < totalSteps;

  const isStage3Active = currentStep >= totalSteps;
  const isStage3Complete = false; // Transitions to success screen immediately upon completion

  const percentage = progress?.percentage ?? 0;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-[#E6EAF0] p-8 sm:p-12 shadow-sm text-center flex flex-col items-center">
        {/* Animated Document Merge Illustration */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center relative shadow-xs">
            <Layers className="w-10 h-10 text-[#3478F6] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#3478F6] text-white flex items-center justify-center text-xs shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>
        </div>

        {/* Heading & Supporting text */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#292D32] tracking-tight mb-2">
          Merging your PDFs...
        </h2>
        <p className="text-sm text-[#858B92] mb-8">
          Combining your documents into one PDF.
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md bg-[#F4F6F8] rounded-full h-2.5 overflow-hidden mb-3">
          <div
            className="bg-[#3478F6] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>

        <div className="w-full max-w-md flex items-center justify-between text-xs text-[#858B92] mb-8">
          <span>
            {progress?.currentFileName ? (
              <span className="truncate max-w-[240px] inline-block align-bottom">
                Processing: {progress.currentFileName}
              </span>
            ) : (
              `${validFilesCount} documents • ${totalPagesCount} pages`
            )}
          </span>
          <span className="font-semibold text-[#3478F6]">{percentage}%</span>
        </div>

        {/* Processing Stages */}
        <div className="w-full max-w-md bg-[#F9FBFC] rounded-2xl border border-[#E6EAF0] p-4 text-left space-y-3.5 mb-8">
          {/* Stage 1 */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {isStage1Complete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : isStage1Active ? (
              <Loader2 className="w-5 h-5 text-[#3478F6] animate-spin flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-[#CBD5E1] flex-shrink-0" />
            )}
            <span
              className={
                isStage1Complete
                  ? 'text-[#292D32] font-semibold'
                  : isStage1Active
                  ? 'text-[#3478F6] font-semibold'
                  : 'text-[#858B92]'
              }
            >
              1. Preparing documents
            </span>
          </div>

          {/* Stage 2 */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {isStage2Complete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : isStage2Active ? (
              <Loader2 className="w-5 h-5 text-[#3478F6] animate-spin flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-[#CBD5E1] flex-shrink-0" />
            )}
            <span
              className={
                isStage2Complete
                  ? 'text-[#292D32] font-semibold'
                  : isStage2Active
                  ? 'text-[#3478F6] font-semibold'
                  : 'text-[#858B92]'
              }
            >
              2. Combining PDF pages
            </span>
          </div>

          {/* Stage 3 */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {isStage3Complete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : isStage3Active ? (
              <Loader2 className="w-5 h-5 text-[#3478F6] animate-spin flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-[#CBD5E1] flex-shrink-0" />
            )}
            <span
              className={
                isStage3Complete
                  ? 'text-[#292D32] font-semibold'
                  : isStage3Active
                  ? 'text-[#3478F6] font-semibold'
                  : 'text-[#858B92]'
              }
            >
              3. Preparing your download
            </span>
          </div>
        </div>

        {/* Privacy reassurance message */}
        <div className="flex items-center gap-2 text-xs text-[#858B92]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Your files are processed locally in your browser.</span>
        </div>

        {/* Optional cancel action */}
        {onCancel && (
          <div className="mt-5 pt-4 border-t border-[#E6EAF0] w-full max-w-md">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-[#858B92] hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-[#E6EAF0] transition-colors cursor-pointer"
            >
              Cancel merge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
