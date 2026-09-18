import React from 'react';
import { 
  Shield, Sliders, Layers, Cpu, ClipboardList, MessageSquare, 
  LogOut, User, LogIn, Activity, Database
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenAuthModal }) {
  const navItems = [
    { id: 'dashboard', label: 'Control Center', icon: Sliders },
    { id: 'dataset', label: 'Dataset (284,807)', icon: Database },
    { id: 'batch', label: 'Batch Scanner', icon: Layers },
    { id: 'model', label: 'Model Intelligence', icon: Cpu },
    { id: 'audit', label: 'Audit Ledger', icon: ClipboardList },
    { id: 'assistant', label: 'Assistant', icon: MessageSquare },
  ];

  const isGuest = !user || user.email === 'guest@fraudshield.local';

  return (
    <header className="bg-[#f4ede2] border-b border-[#e4d8c5] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#1c1917]">FraudShield</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 hidden sm:inline">
                  VIT Code Cortex
                </span>
              </div>
              <span className="text-[11px] text-[#78716c] font-medium block">
                Financial Transaction Fraud Control System
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-[#44403c] hover:bg-[#ebdcc7] hover:text-[#1c1917]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live System Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#ebdcc7]/60 border border-[#dcd1be] px-2.5 py-1 rounded-xl text-[11px] font-semibold text-[#44403c]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Model Online</span>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-2 bg-[#ebdcc7]/60 border border-[#dcd1be] px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-700 flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#292524] max-w-[120px] truncate">
                {user?.name || 'Guest Analyst'}
              </span>
            </div>

            {isGuest ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-700 hover:text-white bg-white hover:bg-orange-600 border border-orange-300 rounded-xl transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#78716c] hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-t border-[#e4d8c5] px-2 py-1.5 gap-1 bg-[#ebdcc7]/40 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-[#44403c] hover:bg-[#ebdcc7]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
