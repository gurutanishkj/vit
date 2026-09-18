import React from 'react';
import { Shield, LayoutDashboard, Search, Cpu, MessageSquare, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Transaction', icon: Search },
    { id: 'model', label: 'Model Info', icon: Cpu },
    { id: 'assistant', label: 'Assistant', icon: MessageSquare },
  ];

  return (
    <header className="bg-[#f4ede2] border-b border-[#e4d8c5] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#1c1917]">FraudShield</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  VIT Code Cortex
                </span>
              </div>
              <span className="text-[11px] text-[#78716c] font-medium block">
                Financial Transaction Fraud Detection System
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
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

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#ebdcc7]/60 border border-[#dcd1be] px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-700 flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#292524]">
                {user?.name || 'Authorized Analyst'}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#78716c] hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-t border-[#e4d8c5] px-2 py-1.5 gap-1 bg-[#ebdcc7]/40 overflow-x-auto">
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
