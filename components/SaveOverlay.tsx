import React from 'react';

interface SaveOverlayProps {
  progress: number;
  message: string;
}

export const SaveOverlay: React.FC<SaveOverlayProps> = ({ progress, message }) => (
  <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
    <div className="w-64 space-y-4 text-center">
      <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
      <h3 className="text-xl font-black text-white uppercase tracking-widest">{message}</h3>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono text-cyan-400">{progress}%</span>
    </div>
  </div>
);
