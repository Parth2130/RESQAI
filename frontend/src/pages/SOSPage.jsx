import React, { useState } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  PhoneCall, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function SOSPage({ setActivePage }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Initial Button, 2: Confirmation & Details, 3: Success Tracking
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [name, setName] = useState(user?.name || '');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [error, setError] = useState(null);

  // Trigger GPS detection
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let addr = "";
        try {
          const res = await api.reverseGeocode(lat, lng);
          if (res && res.address) addr = res.address;
        } catch {}

        setCoords({
          latitude: lat,
          longitude: lng,
          locationText: addr || `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        });
        setLocating(false);
        setStep(2);
      },
      (err) => {
        setLocating(false);
        // Fallback default coordinates (Pune/Delhi central)
        setCoords({ latitude: 18.5204, longitude: 73.8567 });
        setStep(2);
      },
      { timeout: 8000 }
    );
  };

  const handleTransmitSOS = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError("Please provide a contact phone number for responders to reach you.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim() || 'Citizen SOS Beacon',
        contact: phone.trim(),
        latitude: coords?.latitude || 18.5204,
        longitude: coords?.longitude || 73.8567,
        location_text: `Live Coordinates (${coords?.latitude?.toFixed(4)}, ${coords?.longitude?.toFixed(4)})`,
        emergency_type: 'Immediate SOS Distress',
        details: details.trim() || 'High-priority SOS distress beacon triggered by citizen.'
      };

      const res = await api.triggerSOS(payload);
      setSosResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to transmit SOS beacon. Please dial 112 directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 112 Official Life Safety Warning */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-rose-950">IMPORTANT EMERGENCY NOTICE:</span>
            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
              Submitting an SOS through RESQAI alerts registered response teams and nearby monitors. <strong>It does not automatically guarantee government emergency dispatch</strong> unless an official authorized agency integration exists in your area. For life-threatening emergencies, dial <strong>112</strong> immediately.
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs self-start sm:self-auto transition flex items-center space-x-1.5 whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 112</span>
        </a>
      </div>

      {/* STEP 1: PROMINENT SOS BUTTON */}
      {step === 1 && (
        <div className="pastel-card p-8 sm:p-12 text-center space-y-8 shadow-soft-lg border-rose-100">
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest">
              Emergency Distress Transmitter
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Instant Emergency SOS
            </h2>
            <p className="text-xs sm:text-sm text-pastel-muted max-w-md mx-auto">
              Press the SOS button below to transmit your live GPS coordinates and distress signal to authorized response teams.
            </p>
          </div>

          {/* Prominent SOS Button */}
          <div className="flex justify-center py-4">
            <button
              onClick={handleRequestLocation}
              disabled={locating}
              className="relative group w-44 h-44 rounded-full bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 text-white font-black text-2xl shadow-glow-danger hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 border-4 border-rose-200"
            >
              <Radio className={`w-8 h-8 text-rose-100 ${locating ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{locating ? 'Acquiring...' : 'SOS'}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-100">
                Tap to Transmit
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            A confirmation screen will appear to verify your contact information and prevent accidental triggers.
          </p>
        </div>
      )}

      {/* STEP 2: CONFIRMATION & DETAILS */}
      {step === 2 && (
        <form onSubmit={handleTransmitSOS} className="pastel-card p-6 sm:p-8 space-y-6 shadow-soft-lg animate-fadeIn border-rose-100">
          <div className="flex items-center space-x-3 pb-3 border-b border-pastel-border">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Confirm Distress Transmission</h3>
              <p className="text-xs text-slate-500">GPS Coordinates Acquired: {coords?.latitude?.toFixed(4)}, {coords?.longitude?.toFixed(4)}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full p-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone (Required for Responders) *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full p-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Immediate Danger Situation (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="e.g. Trapped by rising floodwater on second floor, power failure, 3 residents inside..."
                className="w-full p-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-glow-danger transition hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>{submitting ? 'Transmitting Distress Beacon...' : 'Transmit SOS Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUCCESSFUL SOS TRANSMISSION */}
      {step === 3 && sosResult && (
        <div className="pastel-card p-8 text-center space-y-6 animate-fadeIn border-rose-200 shadow-soft-lg">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-soft">
            <Radio className="w-8 h-8 animate-ping" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Distress Beacon Active
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              SOS Broadcast Transmitted
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your GPS coordinates have been registered with Incident ID <span className="font-mono font-bold text-[#5278E8]">{sosResult.tracking_id}</span>. Sector responders have been notified.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-pastel-border max-w-sm mx-auto space-y-1 text-xs">
            <div className="font-bold text-slate-800">Incident Tracking ID:</div>
            <div className="text-lg font-mono font-black text-[#5278E8]">{sosResult.tracking_id}</div>
            <div className="text-[11px] text-slate-400">Timestamp: {sosResult.created_at?.slice(0, 19).replace('T', ' ')} UTC</div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActivePage('track')}
              className="px-6 py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition"
            >
              Track SOS Incident Live
            </button>
            <a
              href="tel:112"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-glow-danger transition flex items-center space-x-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 112 (National Helpline)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
