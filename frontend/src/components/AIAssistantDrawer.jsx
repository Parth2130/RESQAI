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
  Radio,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! I am the RESQAI Emergency Safety Assistant powered by Nugen AI.\n\nI can provide verified NDMA safety procedures for earthquakes, floods, cyclones, fires, heatwaves, and 72-hour Go-Bag preparedness in English, Hindi (हिंदी), or Marathi (मराठी).\n\n⚠️ *Crucial:* In an immediate life-threatening emergency, please dial **112** directly."
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
          content: "I am having difficulty retrieving AI response right now. Please remember: in any life-threatening situation, call 112 immediately." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    { en: "What should I do during an earthquake?", hi: "भूकंप के दौरान क्या करना चाहिए?", mr: "भूकंपाच्या वेळी काय करावे?" },
    { en: "How to prepare a 72-hour disaster Go-Bag?", hi: "72 घंटे का आपदा बैग कैसे तैयार करें?", mr: "72 तासांची आपत्ती बॅग कशी तयार करावी?" },
    { en: "Safety precautions during a flash flood?", hi: "अचानक बाढ़ के दौरान सुरक्षा सावधानियां?", mr: "अचानक आलेल्या पुरादरम्यान सुरक्षिततेचे उपाय?" },
    { en: "How to treat severe burn wounds?", hi: "गंभीर जलने की चोटों का प्राथमिक उपचार?", mr: "भाजल्यास प्रथमोपचार कसा करावा?" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-soft-lg flex flex-col h-full border-l border-pastel-border z-10 animate-slideLeft">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#F8FAFF] via-[#EEF2FF] to-white border-b border-pastel-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5278E8] via-[#7E9DF2] to-[#A5B4FC] flex items-center justify-center text-white shadow-soft">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">RESQAI Assistant</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-[#5278E8] border border-indigo-200">
                  NUGEN AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {assistantStatus.configured ? 'Active Generative Inference' : 'NDMA Safety Guidance Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setMessages([messages[0]])}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Selector Bar */}
        <div className="bg-slate-50 px-4 py-2 border-b border-pastel-border flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-slate-600 font-semibold">
            <Languages className="w-3.5 h-3.5 text-[#5278E8]" />
            <span>Response Language:</span>
          </div>
          <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-pastel-border shadow-xs">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  language === lang.code
                    ? 'bg-[#5278E8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {/* Emergency Helplines Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Immediate peril? Call emergency <strong>112</strong></span>
            </div>
            <a href="tel:112" className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-500 shadow-xs">
              Dial 112
            </a>
          </div>

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-card ${
                  msg.role === 'user'
                    ? 'bg-[#5278E8] text-white rounded-br-xs'
                    : 'bg-white border border-pastel-border text-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.content}</div>

                {msg.grounding && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center space-x-1.5 font-medium">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>Grounded with verified Open-Meteo & USGS telemetry</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-pastel-border rounded-2xl px-4 py-3 shadow-card flex items-center space-x-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-[#5278E8] animate-spin" />
                <span>Nugen AI is analyzing telemetry & safety procedures...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Prompts */}
        <div className="p-3 bg-white border-t border-pastel-border">
          <p className="text-[11px] text-slate-400 font-semibold mb-2">Frequently Asked Safety Queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q[language] || q.en)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-[#5278E8] text-slate-700 font-medium transition border border-transparent hover:border-indigo-200"
              >
                {q[language] || q.en}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-pastel-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
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
                  : "Ask about disaster safety, first-aid, or reporting..."
              }
              className="flex-1 bg-slate-50 border border-pastel-border focus:border-[#5278E8] focus:bg-white text-slate-800 text-xs sm:text-sm px-4 py-2.5 rounded-xl outline-none transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-40 text-white p-2.5 rounded-xl shadow-soft transition hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
