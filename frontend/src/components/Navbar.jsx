import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  MapPin, 
  AlertCircle, 
  Search, 
  BookOpen, 
  PhoneForwarded, 
  Lock, 
  Bot, 
  Menu, 
  X 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenAssistant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: ShieldAlert },
    { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
    { id: 'map', label: 'Disaster Map', icon: MapPin },
    { id: 'report', label: 'Report Emergency', icon: AlertCircle, highlight: true },
    { id: 'track', label: 'Track Report', icon: Search },
    { id: 'preparedness', label: 'Preparedness', icon: BookOpen },
    { id: 'resources', label: 'Resources', icon: PhoneForwarded },
    { id: 'admin', label: 'Admin Portal', icon: Lock },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-resq-navy/90 backdrop-blur-md border-b border-resq-border/80 sticky top-[37px] z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-resq-blue via-blue-600 to-indigo-800 flex items-center justify-center shadow-glow-blue border border-blue-400/30 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  RESQ<span className="text-resq-cyan">AI</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Detect. Respond. Save Lives.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    item.highlight
                      ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-glow-red ml-1 mr-1 border border-red-400/40'
                      : isActive
                      ? 'bg-resq-card text-white border border-resq-borderLight text-resq-cyan'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.highlight ? 'text-white' : isActive ? 'text-resq-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* AI Assistant Quick Launcher & Mobile Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-2 bg-gradient-to-r from-resq-blue to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-glow-blue border border-cyan-400/30 transition-all hover:scale-105 active:scale-95"
            >
              <Bot className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span className="hidden sm:inline">AI Safety Assistant</span>
              <span className="sm:hidden">AI Assistant</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-resq-navy/98 border-b border-resq-border px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  item.highlight
                    ? 'bg-red-600 text-white'
                    : isActive
                    ? 'bg-resq-card text-resq-cyan border border-resq-border'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
