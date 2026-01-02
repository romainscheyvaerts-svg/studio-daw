import React from 'react';
import { MobileTab } from '../types';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => (
  <div className="h-16 bg-[#0c0d10] border-t border-white/10 flex items-center justify-around z-50">
    <button
      onClick={() => onTabChange('PROJECT')}
      className={`flex flex-col items-center space-y-1 ${
        activeTab === 'PROJECT' ? 'text-cyan-400' : 'text-slate-500'
      }`}
    >
      <i className="fas fa-project-diagram text-lg"></i>
      <span className="text-[9px] font-black uppercase">Arrangement</span>
    </button>
    <button
      onClick={() => onTabChange('MIXER')}
      className={`flex flex-col items-center space-y-1 ${
        activeTab === 'MIXER' ? 'text-cyan-400' : 'text-slate-500'
      }`}
    >
      <i className="fas fa-sliders-h text-lg"></i>
      <span className="text-[9px] font-black uppercase">Mixer</span>
    </button>
    <button
      onClick={() => onTabChange('NOVA')}
      className={`flex flex-col items-center space-y-1 ${
        activeTab === 'NOVA' ? 'text-cyan-400' : 'text-slate-500'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 -mt-6 border-4 border-[#0c0d10]">
        <i className="fas fa-robot text-white text-lg"></i>
      </div>
      <span className="text-[9px] font-black uppercase">AI Nova</span>
    </button>
    <button
      onClick={() => onTabChange('BROWSER')}
      className={`flex flex-col items-center space-y-1 ${
        activeTab === 'BROWSER' ? 'text-cyan-400' : 'text-slate-500'
      }`}
    >
      <i className="fas fa-folder text-lg"></i>
      <span className="text-[9px] font-black uppercase">Browser</span>
    </button>
    <button
      onClick={() => onTabChange('AUTOMATION')}
      className={`flex flex-col items-center space-y-1 ${
        activeTab === 'AUTOMATION' ? 'text-cyan-400' : 'text-slate-500'
      }`}
    >
      <i className="fas fa-wave-square text-lg"></i>
      <span className="text-[9px] font-black uppercase">Auto</span>
    </button>
  </div>
);
