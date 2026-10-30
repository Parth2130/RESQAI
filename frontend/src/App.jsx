import React, { useState } from 'react';
import EmergencyBanner from './components/EmergencyBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistantDrawer from './components/AIAssistantDrawer';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import PreparednessPage from './pages/PreparednessPage';
import ResourcesPage from './pages/ResourcesPage';
import AdminPage from './pages/AdminPage';

import { Bot } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-resq-dark text-slate-100 selection:bg-resq-blue selection:text-white">
      {/* 1. National Emergency 112 Sticky Warning Bar */}
      <EmergencyBanner />

      {/* 2. Primary Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onOpenAssistant={() => setAssistantOpen(true)} 
      />

      {/* 3. Main Page Routing */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage 
            setActivePage={setActivePage} 
            onOpenAssistant={() => setAssistantOpen(true)} 
          />
        )}
        {activePage === 'dashboard' && (
          <DashboardPage 
            setActivePage={setActivePage} 
          />
        )}
        {activePage === 'map' && (
          <MapPage />
        )}
        {activePage === 'report' && (
          <ReportPage 
            initialTab="report" 
          />
        )}
        {activePage === 'track' && (
          <ReportPage 
            initialTab="track" 
          />
        )}
        {activePage === 'preparedness' && (
          <PreparednessPage />
        )}
        {activePage === 'resources' && (
          <ResourcesPage />
        )}
        {activePage === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* 4. Floating AI Assistant Quick Trigger (Desktop & Mobile) */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-resq-blue via-blue-600 to-resq-cyan text-white px-4 py-3 rounded-full shadow-2xl shadow-blue-500/40 border border-cyan-400/40 hover:scale-105 active:scale-95 transition-all group"
        aria-label="Open AI Safety Assistant"
      >
        <Bot className="w-5 h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-extrabold tracking-wide hidden sm:inline">AI Assistant</span>
      </button>

      {/* 5. Nugen AI Chatbot Drawer */}
      <AIAssistantDrawer 
        isOpen={assistantOpen} 
        onClose={() => setAssistantOpen(false)} 
      />

      {/* 6. Comprehensive Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}
