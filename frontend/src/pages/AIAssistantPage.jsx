import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Languages, 
  Radio, 
  PhoneCall, 
  Info, 
  CheckCircle2, 
  HelpCircle,
  CloudRain,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export default function AIAssistantPage({ setActivePage }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! I am RESQAI Emergency Safety Assistant, powered by Nugen AI.\n\nI can assist you with:\n• Disaster safety protocols (Earthquakes, Floods, Cyclones, Wildfires, Landslides)\n• 72-Hour Emergency Go-Bag checklist\n• First-aid reminders & survival procedures\n• Multilingual guidance in English, हिंदी (Hindi), or मराठी (Marathi)\n\n⚠️ *Important Notice:* In immediate life danger, please dial **112** directly."
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState({ configured: false });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getAssistantStatus()
      .then(res => setAssistantStatus(res))
      .catch(() => setAssistantStatus({ configured: false }));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyToSend = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAssistant({
        message: textToSend,
        language: language,
        history: historyToSend
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          grounding: res.grounding,
          provider: res.provider
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Encountered a connection delay. If you are experiencing an immediate emergency, please dial 112 directly."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    { label: "Earthquake 'Drop, Cover & Hold'", q: "Explain the Drop, Cover, and Hold protocol for earthquakes." },
    { label: "Emergency Go-Bag Checklist", q: "What should I pack in a 72-hour family disaster emergency kit?" },
    { label: "Flash Flood Safety Steps", q: "What immediate actions should I take when floodwaters start rising?" },
    { label: "First-Aid for Bleeding Wounds", q: "What is the standard first-aid procedure to control severe arterial bleeding?" },
    { label: "Cyclone Shelter Protocol", q: "What precautions should be taken before and during a severe cyclone?" }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pastel-border gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5278E8] via-[#7E9DF2] to-[#A5B4FC] flex items-center justify-center text-white shadow-soft">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Emergency Assistant
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
                NUGEN AI
              </span>
            </div>
            <p className="text-xs text-pastel-muted">
              Grounded disaster guidance, NDMA protocols, and location-aware safety instructions.
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-pastel-border shadow-xs text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  language === l.code ? 'bg-[#5278E8] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="p-2 rounded-xl bg-white border border-pastel-border text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 112 Notice */}
      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>
            <strong>Official Protocol:</strong> AI answers are informational. In any life-threatening disaster or immediate medical peril, dial <strong>112</strong> immediately.
          </span>
        </div>
        <a href="tel:112" className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-500 shadow-xs whitespace-nowrap">
          Call 112
        </a>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="pastel-card p-6 shadow-soft space-y-4 min-h-[500px] flex flex-col justify-between">
        {/* Messages List */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-card ${
                  msg.role === 'user'
                    ? 'bg-[#5278E8] text-white rounded-br-xs'
                    : 'bg-white border border-pastel-border text-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.content}</div>

                {msg.grounding && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 font-medium">
                    <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Verified Live Grounding Context:</span>
                    </div>
                    {msg.grounding.weather && (
                      <div className="text-[10px] text-slate-400">
                        • Weather: {msg.grounding.weather.weather_condition}, {msg.grounding.weather.temperature}°C (Open-Meteo)
                      </div>
                    )}
                    {msg.grounding.recent_earthquakes && (
                      <div className="text-[10px] text-slate-400">
                        • Seismic Feeds: {msg.grounding.recent_earthquakes.length} recent quakes monitored (USGS)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-pastel-border rounded-2xl px-4 py-3 shadow-card flex items-center space-x-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-[#5278E8] animate-spin" />
                <span>Nugen AI is reasoning over live telemetry & disaster protocols...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Buttons */}
        <div className="pt-3 border-t border-pastel-border">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recommended Questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.q)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-[#5278E8] border border-pastel-border hover:border-indigo-200 text-slate-700 font-medium transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 pt-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? "आपदा सुरक्षा या आपातकालीन सलाह पूछें..."
                : language === 'mr'
                ? "आपत्ती सुरक्षा किंवा मदतीबद्दल विचारा..."
                : "Ask about disaster protocols, emergency triage, or safety guidelines..."
            }
            className="flex-1 p-3 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-40 text-white font-bold text-xs shadow-soft transition flex items-center space-x-1.5"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
