import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Languages, 
  Info, 
  Globe,
  Radio,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! I am the RESQAI Emergency Preparedness Assistant. I can provide immediate, science-backed safety advice for earthquakes, floods, cyclones, heatwaves, and emergency kits in English, Hindi, or Marathi.\n\n*Important:* In immediate life danger, please dial 112 directly."
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'mr'
  const [loading, setLoading] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState({ configured: false });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getAssistantStatus()
      .then(status => setAssistantStatus(status))
      .catch(() => setAssistantStatus({ configured: false }));
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history excluding initial greeting
      const historyToSend = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      
      const res = await api.chatWithAssistant({
        message: textToSend,
        language: language,
        history: historyToSend
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.response || "No response received.",
        grounding: res.grounding,
        provider: res.provider
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to reach assistant: ${err.message}. If Nugen AI credentials are not yet configured in backend .env, please add NUGEN_API_KEY and NUGEN_MODEL_ID. In immediate danger, call 112.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What emergency preparedness topic can I assist you with?"
      }
    ]);
  };

  const suggestedPrompts = [
    { text: "What should I do during an earthquake?", label: "Earthquake Safety" },
    { text: "How can I stay safe during heavy rainfall and flood?", label: "Flood Action" },
    { text: "What essential items belong in an emergency kit?", label: "72h Go-Bag" },
    { text: "How do I prepare for a cyclone warning?", label: "Cyclone Plan" },
    { text: "What precautions should I take during extreme heat?", label: "Heatwave Alert" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-[500px] bg-resq-navy border-l border-resq-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-resq-card border-b border-resq-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-resq-blue to-resq-cyan flex items-center justify-center text-white shadow-glow-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">RESQAI Assistant</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  assistantStatus.configured 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {assistantStatus.configured ? 'Nugen AI Online' : 'Credentials Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounding with live Open-Meteo & USGS telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              title="Clear chat session"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Notice if not set */}
        {!assistantStatus.configured && (
          <div className="bg-amber-950/60 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Nugen AI is currently in configuration standby. To connect live neural inference, provide <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100 font-mono">NUGEN_API_KEY</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100 font-mono">NUGEN_MODEL_ID</code> in backend <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100 font-mono">.env</code>.
            </p>
          </div>
        )}

        {/* Language selector bar */}
        <div className="bg-resq-dark/80 border-b border-resq-border/60 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Languages className="w-3.5 h-3.5 text-resq-cyan" />
            <span>Response Language:</span>
          </div>
          <div className="flex items-center space-x-1 bg-resq-card p-0.5 rounded-lg border border-resq-border">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                language === 'en' ? 'bg-resq-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                language === 'hi' ? 'bg-resq-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                language === 'mr' ? 'bg-resq-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-resq-blue text-white rounded-tr-none shadow-md'
                    : 'bg-resq-card text-slate-200 border border-resq-border rounded-tl-none shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Grounding pill if telemetry was attached */}
                  {!isUser && m.grounding && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-cyan-300 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>Grounded with verified Open-Meteo & USGS feeds</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {isUser ? 'You' : 'RESQAI Assistant'}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 bg-resq-card border border-resq-border p-3 rounded-2xl w-fit">
              <Bot className="w-4 h-4 text-resq-cyan animate-spin" />
              <span className="text-xs">Analyzing situation & consulting guidelines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Carousel */}
        <div className="px-4 py-2 border-t border-resq-border/40 bg-resq-dark/50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Recommended Questions:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt.text)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-resq-card hover:bg-resq-cardLight text-slate-300 border border-resq-border hover:border-resq-cyan hover:text-white transition"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-resq-card border-t border-resq-border flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask in ${language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'} (e.g., cyclone safety steps)...`}
            className="flex-1 bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-resq-blue transition"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-resq-blue hover:bg-blue-600 disabled:opacity-50 text-white shadow-glow-blue transition active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
