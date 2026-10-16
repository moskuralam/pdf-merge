import React, { useState } from 'react';
import { ShieldCheck, Cpu, HardDrive, ChevronDown, ChevronUp, Check, Globe } from 'lucide-react';

export const BrowserCompatInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E6EAF0] p-4 sm:p-5 shadow-2xs">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#EBF2FE] text-[#3478F6] flex items-center justify-center transition-colors">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#292D32] group-hover:text-[#3478F6] transition-colors">
              Browser Support &amp; Privacy
            </h4>
            <p className="text-[11px] text-[#858B92]">
              Chrome, Edge, Safari, Firefox, Samsung Internet
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'Collapse details' : 'Expand details'}
          className="p-1 rounded-lg text-[#858B92] group-hover:text-[#292D32]"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#E6EAF0] text-xs text-[#858B92] space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#F9FBFC] rounded-xl border border-[#E6EAF0]">
              <div className="flex items-center gap-1.5 font-bold text-[#292D32] mb-1">
                <Check className="w-3.5 h-3.5 text-[#3478F6]" />
                <span>Chromium</span>
              </div>
              <p className="text-[11px] text-[#858B92]">
                Chrome &amp; Edge with hardware acceleration and rapid file parsing.
              </p>
            </div>

            <div className="p-3 bg-[#F9FBFC] rounded-xl border border-[#E6EAF0]">
              <div className="flex items-center gap-1.5 font-bold text-[#292D32] mb-1">
                <Check className="w-3.5 h-3.5 text-[#3478F6]" />
                <span>Apple WebKit</span>
              </div>
              <p className="text-[11px] text-[#858B92]">
                macOS &amp; iOS Safari with Web Share API and Files app integration.
              </p>
            </div>

            <div className="p-3 bg-[#F9FBFC] rounded-xl border border-[#E6EAF0]">
              <div className="flex items-center gap-1.5 font-bold text-[#292D32] mb-1">
                <Check className="w-3.5 h-3.5 text-[#3478F6]" />
                <span>Gecko &amp; Mobile</span>
              </div>
              <p className="text-[11px] text-[#858B92]">
                Firefox &amp; Samsung Internet with touch reorder controls.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6EAF0] flex flex-wrap items-center gap-4 text-[11px] text-[#858B92]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3478F6]" />
              <strong>100% Local:</strong> Documents never leave your device.
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[#3478F6]" />
              <strong>Cooperative Yield:</strong> Non-blocking thread execution.
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-[#3478F6]" />
              <strong>Auto Cleanup:</strong> In-memory URLs revoked on completion.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
