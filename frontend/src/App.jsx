import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';

// Components
import EmergencyBanner from './components/EmergencyBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistantDrawer from './components/AIAssistantDrawer';

// 15 Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import SOSPage from './pages/SOSPage';
import AIAssistantPage from './pages/AIAssistantPage';
import PreparednessPage from './pages/PreparednessPage';
import ResourcesPage from './pages/ResourcesPage';
import ResponderDashboard from './pages/ResponderDashboard';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

import { Bot } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-8 max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="text-xl font-black">!</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Live View Encountered an Issue</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || "An interface element encountered a rendering error."}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                  else window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-[#5278E8] text-white font-bold text-xs shadow-soft hover:bg-[#4365D0] transition"
              >
                Reload View
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#F8FAFF] text-slate-800 selection:bg-indigo-100 selection:text-[#5278E8] font-sans antialiased">
        {/* 1. National Emergency 112 Sticky Warning Bar */}
        <EmergencyBanner />

        {/* 2. Primary Navigation */}
        <Navbar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onOpenAssistant={() => setAssistantOpen(true)} 
        />

        {/* 3. Main Page Routing (All 15 Connected Pages) */}
        <main className="flex-1">
          <ErrorBoundary key={activePage} onReset={() => setActivePage('home')}>
            {activePage === 'home' && (
              <HomePage 
                setActivePage={setActivePage} 
                onOpenAssistant={() => setAssistantOpen(true)} 
              />
            )}

            {activePage === 'login' && (
              <LoginPage 
                setActivePage={setActivePage} 
              />
            )}

            {activePage === 'register' && (
              <RegisterPage 
                setActivePage={setActivePage} 
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

            {activePage === 'sos' && (
              <SOSPage 
                setActivePage={setActivePage} 
              />
            )}

            {activePage === 'ai-assistant' && (
              <AIAssistantPage 
                setActivePage={setActivePage} 
              />
            )}

            {activePage === 'safety' && (
              <PreparednessPage />
            )}

            {activePage === 'preparedness' && (
              <PreparednessPage />
            )}

            {activePage === 'resources' && (
              <ResourcesPage />
            )}

            {activePage === 'track' && (
              <ReportPage 
                initialTab="track" 
              />
            )}

            {activePage === 'responder' && (
              <ResponderDashboard 
                setActivePage={setActivePage} 
              />
            )}

            {activePage === 'admin' && (
              <AdminPage 
                setActivePage={setActivePage} 
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsPage />
            )}

            {activePage === 'profile' && (
              <ProfilePage 
                setActivePage={setActivePage} 
              />
            )}
          </ErrorBoundary>
        </main>

        {/* 4. Floating AI Assistant Quick Trigger */}
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-[#5278E8] via-[#6B8CF0] to-[#38BDF8] text-white px-4 py-3 rounded-full shadow-soft-lg hover:shadow-indigo-300 border border-white/40 hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open Nugen AI Safety Assistant"
        >
          <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">AI Safety Assistant</span>
        </button>

        {/* 5. Nugen AI Chatbot Drawer */}
        <AIAssistantDrawer 
          isOpen={assistantOpen} 
          onClose={() => setAssistantOpen(false)} 
        />

        {/* 6. Comprehensive Footer */}
        <Footer setActivePage={setActivePage} />
      </div>
    </AuthProvider>
  );
}
