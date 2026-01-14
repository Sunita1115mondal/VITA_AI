import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Mic,
  Lock,
  Mail,
  ArrowRight,
  UserPlus,
  Loader2,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice control is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.toLowerCase();

      if (text.includes('login') || text.includes('log in')) {
        handleLogin();
      } else if (text.includes('create account')) {
        // Visual feedback for demo
        const btn = document.getElementById('create-account-btn');
        if (btn) {
          btn.click();
          btn.classList.add('ring-4', 'ring-blue-200');
          setTimeout(
            () => btn.classList.remove('ring-4', 'ring-blue-200'),
            500
          );
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    // Simulate secure login API call delay
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 font-sans relative">
      {/* Accessibility Voice Status */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-500 z-50 ${
          isListening
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        <span className="text-slate-700 font-semibold text-sm">
          Listening... Say "Login" or "Create Account"
        </span>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden relative animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-teal-400"></div>

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4 transform hover:scale-105 transition-transform">
              <Activity size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              VITA-AI
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Health Prediction System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@vita.ai"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  aria-label="Email Address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 ml-1"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  aria-label="Password"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              aria-label="Log In"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" /> Verify Credentials...
                </>
              ) : (
                <>
                  Log In{' '}
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400 font-medium">
                OR
              </span>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-4">
            <button
              id="create-account-btn"
              type="button"
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold text-lg hover:border-blue-200 hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              aria-label="Create Account"
            >
              <UserPlus
                size={20}
                className="text-slate-400 group-hover:text-blue-500 transition-colors"
              />
              Create Account
            </button>

            {/* Voice Control Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isListening
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
                aria-label={
                  isListening ? 'Stop Voice Control' : 'Enable Voice Control'
                }
              >
                {isListening ? (
                  <>
                    <Mic size={16} className="animate-pulse" /> Voice Listening
                    Active
                  </>
                ) : (
                  <>
                    <Mic size={16} /> Enable Voice Control
                  </>
                )}
              </button>

              {!isListening && (
                <p className="text-center text-xs text-slate-400 mt-2">
                  Try saying: "Login" or "Create Account"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-slate-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <p>VITA-AI Medical Systems © 2025</p>
      </div>
    </div>
  );
};

export default LoginPage;
