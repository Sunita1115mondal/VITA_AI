import React, { useEffect, useState, useRef } from 'react';
import { Phone, X, AlertTriangle, MapPin, Loader2, Send } from 'lucide-react';

interface EmergencyOverlayProps {
  isVisible: boolean;
  reason: string;
  location: { lat: number; lng: number } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ isVisible, reason, location, onCancel, onConfirm }) => {
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setCountdown(10);
      
      // 1. Speak Loudly (Native TTS for speed/offline capability)
      const speakAlert = () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Warning. Your vitals are abnormal. Should I alert your emergency contact?");
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          utterance.volume = 1.0; // Max volume
          window.speechSynthesis.speak(utterance);
        }
      };
      speakAlert();

      // 2. Vibrate (Long Buzz x 3)
      if (navigator.vibrate) {
        navigator.vibrate([800, 200, 800, 200, 800]);
      }

      // 3. Start Countdown
      intervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            onConfirm(); // Auto-trigger
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible, onConfirm]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-500 relative">
        
        {/* Pulsing Background Animation */}
        <div className="absolute inset-0 bg-rose-500/10 animate-pulse"></div>
        
        {/* Header */}
        <div className="bg-rose-600 p-6 text-white text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full animate-bounce">
              <AlertTriangle size={48} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-wider">Emergency Mode</h2>
          <p className="text-rose-100 mt-2 font-medium">{reason}</p>
        </div>

        {/* Body */}
        <div className="p-8 text-center relative z-10">
          <p className="text-slate-600 font-medium mb-2">Auto-contacting Dr. Smith in:</p>
          <div className="text-7xl font-black text-rose-600 mb-6 tabular-nums">
            {countdown}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex items-start gap-3 text-left">
            <MapPin className="text-rose-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Your Current Location</p>
              {location ? (
                <p className="text-slate-800 font-mono text-sm">
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
              ) : (
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <Loader2 size={12} className="animate-spin" /> Locating...
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Phone size={24} />
              CALL NOW
            </button>
            
            <button
              onClick={onCancel}
              className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <X size={24} />
              I'M OKAY - CANCEL
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Emergency Contact: <strong>Dr. Sarah Smith (Cardiology)</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyOverlay;