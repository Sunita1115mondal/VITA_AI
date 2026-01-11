import React from 'react';
import { LayoutDashboard, History, LogOut, Activity, Menu, Mic, Trophy } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'history' | 'coach';
  onChangeView: (view: 'dashboard' | 'history' | 'coach') => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isListening: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, isCollapsed, onToggle, isListening }) => {
  return (
    <aside 
      className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl border-r border-slate-800 bg-slate-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Toggle */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50 flex-shrink-0">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold tracking-tight text-white">VITA-AI</h1>
              <p className="text-xs text-slate-400 font-medium">Patient Portal</p>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={onToggle}
          className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${isCollapsed ? 'mt-2' : ''}`}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        <button
          onClick={() => onChangeView('dashboard')}
          title={isCollapsed ? "Dashboard" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
            currentView === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <LayoutDashboard size={20} className={`flex-shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'} ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Dashboard</span>}
        </button>

        <button
          onClick={() => onChangeView('history')}
          title={isCollapsed ? "History & Analytics" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
            currentView === 'history' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <History size={20} className={`flex-shrink-0 ${currentView === 'history' ? 'text-white' : 'text-slate-500 group-hover:text-white'} ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">History & Analytics</span>}
        </button>

        {/* Health Coach Button */}
        <button
          onClick={() => onChangeView('coach')}
          title={isCollapsed ? "Health Coach Mode" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group border border-transparent ${
            currentView === 'coach' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30 border-indigo-500/30' 
              : 'text-slate-400 hover:bg-indigo-900/20 hover:text-indigo-300'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <Trophy size={20} className={`flex-shrink-0 ${currentView === 'coach' ? 'text-yellow-300' : 'text-slate-500 group-hover:text-indigo-400'} ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Health Coach</span>}
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        {/* Voice Status Indicator */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-colors ${
           isListening 
           ? 'bg-red-500/10 border border-red-500/50 text-red-400' 
           : 'bg-slate-800/50 border border-slate-700 text-slate-500'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}>
           <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
           {!isCollapsed && <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">{isListening ? "Listening..." : "Voice Ready"}</span>}
        </div>

        <button
          onClick={onLogout}
          title={isCollapsed ? "Sign Out" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;