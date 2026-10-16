import React from 'react';
import { Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-[#E6EAF0] sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-3.5 flex items-center">
        {/* Brand logo & name */}
        <div className="flex items-center gap-3">
          {/* Dark squircle logo icon */}
          <div className="w-10 h-10 rounded-xl bg-[#1E232A] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-base font-bold text-[#292D32] tracking-tight">
            PDF Merge
          </h1>
        </div>
      </div>
    </header>
  );
};
