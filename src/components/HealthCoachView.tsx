import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Trophy,
  Calendar,
  Moon,
  Sun,
  Dumbbell,
  ArrowRight,
  RefreshCw,
  Quote,
  Heart,
  Volume2,
  Loader2,
} from 'lucide-react';
import { AnalysisResult, CoachInsight } from '../types/types';
import { getHealthCoachAdvice, generateSpeech } from '../services/gemini';
import { playPcmAudio } from '../utils/helpers';

interface HealthCoachViewProps {
  lastAnalysis: AnalysisResult | null;
}

const HealthCoachView: React.FC<HealthCoachViewProps> = ({ lastAnalysis }) => {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const data = await getHealthCoachAdvice(lastAnalysis);
      setInsight(data);
    } catch (e) {
      console.error('Coach Error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [lastAnalysis]);

  const playCoachAudio = async () => {
    if (!insight || isPlaying || isGeneratingAudio) return;

    setIsGeneratingAudio(true);
    try {
      // Construct a natural script for the coach to read, ensuring all inputs are strings
      const script = `
        Hello, Coach VITA here.
        ${String(insight.motivationalMessage)}
        Here is my advice for you: ${String(insight.personalizedAdvice)}
        For your exercise today, I recommend ${String(
          insight.exercisePlan.type
        )} for ${String(insight.exercisePlan.duration)}.
        Let's get moving!
      `;

      const audioData = await generateSpeech(script);
      setIsGeneratingAudio(false);
      setIsPlaying(true);
      await playPcmAudio(audioData);
    } catch (e) {
      console.error('Voice Error', e);
    } finally {
      setIsGeneratingAudio(false);
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-in fade-in">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <Sparkles
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600"
            size={24}
          />
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">
          Your Personal Health Coach is thinking...
        </p>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header / Motivational Quote */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              <Sparkles size={12} /> Daily Motivation
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={playCoachAudio}
                disabled={isGeneratingAudio || isPlaying}
                className={`p-2 rounded-full transition-all flex items-center gap-2 border border-white/20 ${
                  isGeneratingAudio || isPlaying
                    ? 'bg-white/30 text-white cursor-wait'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Listen to Coach"
              >
                {isGeneratingAudio ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Volume2
                    size={18}
                    className={isPlaying ? 'animate-pulse' : ''}
                  />
                )}
                {(isGeneratingAudio || isPlaying) && (
                  <span className="text-xs font-bold mr-1 hidden sm:inline">
                    {isGeneratingAudio ? 'Loading...' : 'Speaking...'}
                  </span>
                )}
              </button>

              <button
                onClick={fetchAdvice}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="New Motivation"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4 flex gap-3">
            <Quote
              className="flex-shrink-0 fill-white/20 stroke-none"
              size={40}
            />
            {String(insight.motivationalMessage)}
          </h2>
          <p className="text-indigo-100 font-medium flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            Let's crush your goals today!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Advice & Reminders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personalized Advice */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Heart className="text-rose-500" /> Personalized Advice
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {String(insight.personalizedAdvice)}
            </p>
          </div>

          {/* Exercise Plan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -mr-8 -mt-8 z-0"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Dumbbell className="text-orange-500" /> Suggested Workout
              </h3>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-3xl font-black text-slate-900 mb-1">
                    {String(insight.exercisePlan.type)}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />{' '}
                      {String(insight.exercisePlan.duration)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs uppercase ${
                        String(insight.exercisePlan.intensity) === 'High'
                          ? 'bg-red-100 text-red-700'
                          : String(insight.exercisePlan.intensity) === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {String(insight.exercisePlan.intensity)} Intensity
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {String(insight.exercisePlan.description)}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg">
                    Start <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Wellness Tracking */}
        <div className="space-y-6">
          {/* Daily Reminders */}
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4">
              Daily Reminders
            </h3>
            <ul className="space-y-3">
              {insight.dailyReminders.map((reminder, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-200 mt-0.5 flex-shrink-0"></div>
                  <span className="text-slate-700 text-sm font-medium">
                    {String(reminder)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sleep & Stress */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Wellness Tracker</h3>

            <div className="space-y-6">
              {/* Sleep */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
                    <Moon size={16} /> Sleep Quality
                  </div>
                  <span className="text-white font-bold">
                    {insight.sleepTracking.hours} hrs
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-indigo-400 h-2 rounded-full"
                    style={{
                      width:
                        String(insight.sleepTracking.quality) === 'Good'
                          ? '85%'
                          : String(insight.sleepTracking.quality) === 'Fair'
                          ? '60%'
                          : '40%',
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400">
                  {String(insight.sleepTracking.insight)}
                </p>
              </div>

              {/* Stress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 text-rose-300 text-sm font-medium">
                    <Sun size={16} /> Stress Level
                  </div>
                  <span className="text-white font-bold">
                    {String(insight.stressTracking.level)}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{
                      width:
                        String(insight.stressTracking.level) === 'High'
                          ? '90%'
                          : String(insight.stressTracking.level) === 'Medium'
                          ? '50%'
                          : '20%',
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400">
                  {String(insight.stressTracking.insight)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCoachView;
