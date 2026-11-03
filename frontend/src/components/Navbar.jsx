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
  X,
  Radio,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ activePage, setActivePage, onOpenAssistant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout, isResponder, isAdmin } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: ShieldAlert },
    { id: 'dashboard', label: 'Citizen Portal', icon: Activity },
    { id: 'map', label: 'Disaster Map', icon: MapPin },
    { id: 'report', label: 'Report Emergency', icon: AlertCircle, highlight: true },
    { id: 'sos', label: 'SOS Distress', icon: Radio, sosHighlight: true },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'safety', label: 'Safety Center', icon: BookOpen },
    { id: 'resources', label: 'Resources', icon: PhoneForwarded },
    { id: 'track', label: 'Track Incident', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (isResponder) {
    navItems.push({ id: 'responder', label: 'Responder Control', icon: Radio, badge: 'OPS' });
  }

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Dashboard', icon: Lock, badge: 'ADMIN' });
  }

  const handleNavClick = (id) => {
    setActivePage(id);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-pastel-border sticky top-[37px] z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5278E8] via-[#7E9DF2] to-[#A5B4FC] flex items-center justify-center shadow-soft border border-indigo-200 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent">
                  RESQ<span className="text-[#5278E8]">AI</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200 uppercase tracking-widest">
                  DISASTER OPS
                </span>
              </div>
              <p className="text-[10px] text-pastel-muted font-medium tracking-wide">
                Detect Faster. Respond Smarter. Save Lives.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              if (item.sosHighlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span>SOS</span>
                  </button>
                );
              }

              if (item.highlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5278E8] hover:bg-[#4365D0] text-white shadow-soft transition-all hover:scale-105 active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                    <span>Report Incident</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-[#5278E8] font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5278E8]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Menu Dropdown for remaining links */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-pastel-border rounded-2xl shadow-soft-lg py-2 z-50 animate-fadeIn">
                  {navItems.slice(7).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-[#5278E8] transition"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Area: Auth & AI Trigger */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-200/80 hover:border-indigo-400 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nugen AI</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center space-x-2 bg-slate-50 border border-pastel-border px-3 py-1.5 rounded-xl text-xs font-medium text-slate-800 hover:bg-indigo-50 hover:border-indigo-200 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#5278E8] flex items-center justify-center font-bold text-[10px]">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <span className="font-semibold truncate max-w-[100px]">{user?.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
                    {user?.role}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#5278E8] hover:bg-slate-50 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5278E8] text-white hover:bg-[#4365D0] shadow-soft transition hover:scale-105"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => handleNavClick('sos')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200"
            >
              SOS
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-pastel-border px-4 pt-2 pb-6 space-y-2 shadow-lg animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pt-2 pb-3 border-b border-pastel-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl text-xs font-semibold text-left transition ${
                    isActive 
                      ? 'bg-indigo-50 text-[#5278E8]' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center space-x-2 text-xs font-medium text-slate-800"
                >
                  <User className="w-4 h-4 text-[#5278E8]" />
                  <span>{user?.name} ({user?.role})</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-xs text-red-600 font-semibold px-2 py-1 bg-red-50 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 w-full">
                <button
                  onClick={() => handleNavClick('login')}
                  className="flex-1 py-2 text-center text-xs font-semibold border border-pastel-border rounded-xl text-slate-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="flex-1 py-2 text-center text-xs font-bold bg-[#5278E8] text-white rounded-xl shadow-soft"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
