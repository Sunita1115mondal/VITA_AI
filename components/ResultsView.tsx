import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, HeartPulse, Volume2, Loader2, Play, Square } from 'lucide-react';
import { generateSpeech } from '../services/gemini';
import { playPcmAudio } from '../utils/helpers';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
  isHandsFree?: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, isHandsFree }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<boolean>(false); // Track if audio has been triggered
  
  // Vitals Sonification State
  const [isSonifying, setIsSonifying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);

  const handleReadAloud = async () => {
    if (isPlaying || isLoadingAudio) return;
    
    // Stop sonification if playing
    if (isSonifying) toggleSonification();
    
    setIsLoadingAudio(true);
    try {
      // Create a concise summary for reading
      const textToRead = `Analysis complete. Risk level is ${result.riskLevel}. Heart rate estimated at ${result.vitalMetrics.heartRate} beats per minute. ${result.reasoning} Recommendations: ${result.recommendations.slice(0, 2).join('. ')}.`;
      
      const audioBase64 = await generateSpeech(textToRead);
      setIsLoadingAudio(false);
      setIsPlaying(true);
      await playPcmAudio(audioBase64);
      setIsPlaying(false);
    } catch (e) {
      console.error("TTS Error", e);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  // --- Real-Time Audio Vitals Visualization Logic ---
  const toggleSonification = () => {
    if (isSonifying) {
      stopSonification();
    } else {
      startSonification();
    }
  };

  const startSonification = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const bpm = result.vitalMetrics.heartRate || 75; // Default if missing
      const intervalMs = 60000 / bpm;
      
      // Calculate Pitch based on HR (Low HR = Low Pitch, High HR = High Pitch)
      // Map 40-180 BPM to 150-800 Hz
      const minBpm = 40, maxBpm = 180;
      const minHz = 150, maxHz = 800;
      const frequency = Math.max(minHz, Math.min(maxHz, 
        minHz + ((bpm - minBpm) * (maxHz - minHz) / (maxBpm - minBpm))
      ));

      // Tone Type based on Risk (Smooth = Normal, Sawtooth = Alert)
      const waveType: OscillatorType = result.riskLevel === 'Low' ? 'sine' : result.riskLevel === 'Moderate' ? 'triangle' : 'sawtooth';

      const playPulse = () => {
        if (!audioContextRef.current) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // ADSR Envelope for Heartbeat sound (Lub-dub feel simplified to a pulse)
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Decay
        
        osc.start(now);
        osc.stop(now + 0.3);
      };

      playPulse(); // Play immediate
      pulseIntervalRef.current = window.setInterval(playPulse, intervalMs);
      
      setIsSonifying(true);
    } catch (e) {
      console.error("Audio API Error", e);
    }
  };

  const stopSonification = () => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsSonifying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSonification();
    };
  }, []);

  // Trigger Haptic Feedback and Auto-Audio on Mount
  useEffect(() => {
    // 1. Haptics
    if (navigator.vibrate) {
      if (result.riskLevel === 'High') {
        navigator.vibrate([500, 100, 500, 100, 500]);
      } else if (result.riskLevel === 'Moderate') {
        navigator.vibrate([300, 100, 300]);
      } else {
        navigator.vibrate(200);
      }
    }

    // 2. Auto-Play Audio for Hands-Free Mode
    if (isHandsFree && !audioRef.current) {
      audioRef.current = true;
      // Small timeout to allow haptics to start first
      setTimeout(() => {
        handleReadAloud();
      }, 500);
    }
  }, [result, isHandsFree]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Level Card */}
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${getRiskColor(result.riskLevel)}`}>
          <div>
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">Risk Level</p>
            <h2 className="text-3xl font-bold mt-1">{result.riskLevel}</h2>
          </div>
          <div className="p-3 bg-white/50 rounded-full">
            {result.riskLevel === 'High' ? <AlertTriangle size={32} /> : 
             result.riskLevel === 'Moderate' ? <Activity size={32} /> : 
             <CheckCircle size={32} />}
          </div>
        </div>

        {/* Fitness Score Card */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Fitness Score</p>
            <h2 className={`text-4xl font-bold mt-1 ${getScoreColor(result.fitnessScore)}`}>
              {result.fitnessScore}<span className="text-lg text-slate-400 font-normal">/100</span>
            </h2>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-100"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * result.fitnessScore) / 100}
                className={getScoreColor(result.fitnessScore)}
              />
            </svg>
            <HeartPulse size={20} className={`absolute ${getScoreColor(result.fitnessScore)}`} />
          </div>
        </div>
      </div>

      {/* Audio Vitals Visualization Card */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
         {/* Background Pulse Animation */}
         {isSonifying && (
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                 <div className="w-full h-full bg-blue-500/10 animate-pulse" style={{ animationDuration: `${60000 / (result.vitalMetrics.heartRate || 75)}ms` }}></div>
            </div>
         )}
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Activity className="text-blue-400" />
                  Real-Time Audio Vitals
               </h3>
               <p className="text-slate-400 text-sm max-w-md">
                 Converts data to sound for vision-impaired users. 
                 <br/>
                 <span className="text-xs opacity-70">Low pitch = Low HR • Fast tempo = Fast HR • Smooth tone = Normal</span>
               </p>
               <div className="flex items-center gap-4 mt-4">
                  <div className="bg-slate-800 px-3 py-1 rounded-md text-xs font-mono text-blue-300 border border-slate-700">
                    HR: {result.vitalMetrics.heartRate || '--'} BPM
                  </div>
                  <div className="bg-slate-800 px-3 py-1 rounded-md text-xs font-mono text-blue-300 border border-slate-700">
                    Resp: {result.vitalMetrics.respirationRate || '--'} /min
                  </div>
               </div>
            </div>

            <button
               onClick={toggleSonification}
               className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border-4 ${
                 isSonifying 
                 ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                 : 'bg-blue-600 border-blue-500 text-white hover:scale-105'
               }`}
            >
               {isSonifying ? <Square size={24} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
         </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            AI Analysis
          </h3>
          <button
            onClick={handleReadAloud}
            disabled={isLoadingAudio || isPlaying}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isPlaying 
                ? 'bg-blue-100 text-blue-700 animate-pulse' 
                : isLoadingAudio
                ? 'bg-slate-100 text-slate-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isLoadingAudio ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
            {isPlaying ? "Playing..." : isLoadingAudio ? "Generating Audio..." : "Read Aloud"}
          </button>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {result.reasoning}
        </p>
      </div>

      {/* Recommendations & Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={20} />
            Recommendations
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-emerald-400 rounded-full" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Trend Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-500" size={20} />
            Trend Analysis
          </h3>
          <p className="text-slate-600 text-sm mb-6 flex-grow">
            {result.trendSummary}
          </p>
          
          {/* Chart */}
          {result.chartData && result.chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
              No historical data available for charting
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResultsView;