import React from 'react';
import { Mic, Smartphone, Activity, Wifi, Volume2, Power, AlertCircle, Headphones } from 'lucide-react';

interface AccessibilityPosterProps {
  isListening: boolean;
  onToggle: () => void;
  error?: string | null;
}

const AccessibilityPoster: React.FC<AccessibilityPosterProps> = ({ isListening, onToggle, error }) => {
  
  // Helper for manual sound test
  const playTestTone = (type: 'success' | 'alert') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="mt-16 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto transform transition-all hover:shadow-2xl mb-12">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-2">
             <div className="bg-blue-500/20 p-2 rounded-lg backdrop-blur-sm border border-blue-500/30">
               <Headphones className="text-blue-400" size={24} />
             </div>
             <span className="text-blue-400 font-bold tracking-widest text-xs uppercase">VITA-AI Hands-Free</span>
           </div>
           <h2 className="text-3xl font-bold tracking-tight">100% Hands-Free Operation</h2>
           <p className="text-slate-400 mt-1 max-w-md">Voice-controlled health analysis for total accessibility.</p>
        </div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        
        {/* Feature 1: Wake-Word Activation */}
        <div className={`p-8 flex flex-col items-center text-center relative overflow-hidden group transition-colors ${isListening ? 'bg-blue-50/50' : ''}`}>
            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold animate-pulse z-20">
                <Mic size={12} /> LISTENING
              </div>
            )}
            
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Mic size={120} />
            </div>

            <div className="relative mb-8 mt-4">
                {/* Phone mockup */}
                <div className="w-32 h-60 border-[6px] border-slate-800 rounded-[2rem] bg-slate-950 flex flex-col items-center justify-center relative z-10 shadow-2xl">
                    <div className="absolute top-0 w-16 h-4 bg-slate-800 rounded-b-xl z-20"></div>
                    
                    {/* Screen Content */}
                    <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-slate-900 flex flex-col items-center justify-center relative">
                        {/* Audio Waveform Animation */}
                        <div className="flex items-center justify-center gap-1 h-12">
                             <div className={`w-1.5 rounded-full h-4 transition-all duration-300 ${isListening ? 'bg-blue-500 animate-[bounce_1s_infinite]' : 'bg-slate-700'}`}></div>
                             <div className={`w-1.5 rounded-full h-8 transition-all duration-300 ${isListening ? 'bg-blue-400 animate-[bounce_1.2s_infinite]' : 'bg-slate-700'}`}></div>
                             <div className={`w-1.5 rounded-full h-10 transition-all duration-300 ${isListening ? 'bg-teal-400 animate-[bounce_0.8s_infinite]' : 'bg-slate-700'}`}></div>
                             <div className={`w-1.5 rounded-full h-6 transition-all duration-300 ${isListening ? 'bg-blue-400 animate-[bounce_1.1s_infinite]' : 'bg-slate-700'}`}></div>
                             <div className={`w-1.5 rounded-full h-3 transition-all duration-300 ${isListening ? 'bg-blue-500 animate-[bounce_0.9s_infinite]' : 'bg-slate-700'}`}></div>
                        </div>
                        <p className={`text-[10px] mt-4 font-mono transition-colors ${isListening ? 'text-blue-400' : 'text-slate-600'}`}>
                          {isListening ? "LISTENING..." : "IDLE"}
                        </p>
                    </div>
                </div>
                
                {/* Voice waves emitting */}
                {isListening && (
                  <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full animate-ping border border-blue-200/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/10 rounded-full animate-ping animation-delay-500"></div>
                  </>
                )}
            </div>
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center justify-center gap-2">
                <Mic className="text-blue-600" size={20} />
                Wake-Word Activation
              </h3>
              
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 px-6 py-4 rounded-xl mb-4 shadow-sm w-full">
                  <p className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-wider">Say Command</p>
                  <p className="text-blue-900 font-bold text-lg leading-tight">"Hello Health Assistant"</p>
              </div>
              
              <button
                onClick={onToggle}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  isListening 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                <Power size={18} />
                {isListening ? "Stop Hands-Free Mode" : "Enable 100% Hands-Free Mode"}
              </button>

              {error && (
                <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>
        </div>

        {/* Feature 2: Haptic Vibration Alerts */}
        <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 p-4 opacity-5">
                <Smartphone size={120} />
             </div>

             <div className="relative mb-8 mt-4">
                 {/* Phone with Vibration Lines */}
                 <div className="w-32 h-60 border-[6px] border-slate-800 rounded-[2rem] bg-white flex flex-col items-center justify-center relative z-10 shadow-2xl">
                    <div className="absolute top-0 w-16 h-4 bg-slate-800 rounded-b-xl z-20"></div>
                    
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                      <Activity className="text-rose-500" size={32} />
                      <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                      <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
                    </div>
                 </div>
                 
                 {/* Haptic Motion Lines (Ripples) */}
                 <div className="absolute top-4 -right-6">
                    <Wifi className="text-slate-400 rotate-90 w-12 h-12 animate-pulse" />
                 </div>
                 <div className="absolute top-4 -left-6">
                    <Wifi className="text-slate-400 -rotate-90 w-12 h-12 animate-pulse" />
                 </div>
                 <div className="absolute bottom-10 -right-6">
                    <Wifi className="text-slate-400 rotate-90 w-12 h-12 animate-pulse delay-75" />
                 </div>
                 <div className="absolute bottom-10 -left-6">
                    <Wifi className="text-slate-400 -rotate-90 w-12 h-12 animate-pulse delay-75" />
                 </div>
             </div>

             <div className="relative z-10 w-full">
               <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
                 <Volume2 className="text-rose-500" size={20} />
                 Confirmation Sounds & Haptics
               </h3>
               
               <div className="space-y-3 w-full max-w-xs mx-auto">
                  {/* Normal Alert */}
                  <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer group" onClick={() => { 
                      navigator.vibrate && navigator.vibrate(200);
                      playTestTone('success');
                    }}>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Success</span>
                      <div className="flex items-center gap-3">
                          <span className="text-[10px] text-emerald-600 font-mono">BEEP + BUZZ</span>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping"></div>
                      </div>
                  </div>

                  {/* Critical Alert */}
                  <div className="flex items-center justify-between bg-rose-50 p-3 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer group" onClick={() => {
                      navigator.vibrate && navigator.vibrate([500, 100, 500, 100, 500]);
                      playTestTone('alert');
                    }}>
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">Alert</span>
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-600 font-mono">TONE + LONG</span>
                          <div className="flex gap-1">
                            <div className="w-3 h-1.5 bg-rose-500 rounded-full group-hover:animate-[pulse_0.5s_infinite]"></div>
                            <div className="w-3 h-1.5 bg-rose-500 rounded-full group-hover:animate-[pulse_0.5s_infinite] delay-100"></div>
                            <div className="w-3 h-1.5 bg-rose-500 rounded-full group-hover:animate-[pulse_0.5s_infinite] delay-200"></div>
                          </div>
                      </div>
                  </div>
               </div>
               
               <p className="text-slate-600 text-sm mt-4 leading-relaxed">
                   Audio confirmation and tactile feedback allow for confident <span className="font-bold text-slate-900">eyes-free usage</span>.
               </p>
             </div>
        </div>

      </div>
      
      <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">VITA-AI • Accessible Technology Initiative</p>
      </div>
    </section>
  );
};

export default AccessibilityPoster;