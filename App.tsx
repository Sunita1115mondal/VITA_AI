import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Activity, AlertCircle, Loader2, Image as ImageIcon, MessageSquare, X, ChevronRight, ClipboardCheck, Menu } from 'lucide-react';
// Note: Ensure these components exist in your file structure
import VoiceInput from './components/VoiceInput';
import ResultsView from './components/ResultsView';
import ChatWidget from './components/ChatWidget';
import AccessibilityPoster from './components/AccessibilityPoster';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import HistoryView from './components/HistoryView';
import EmergencyOverlay from './components/EmergencyOverlay';
import HealthCoachView from './components/HealthCoachView';
import { analyzeHealthData } from './services/gemini';
import { AnalysisResult, AnalysisStatus, EmergencyEvent } from './types';

// Q&A Session Data
const HEALTH_QUESTIONS = [
  { q: "How are you feeling right now?", options: ["Good", "Tired", "Dizzy", "Stressed", "Unwell"] },
  { q: "Did you sleep well last night?", options: ["Yes", "No", "Less than 5 hours"] },
  { q: "What were you doing in the last 5 minutes?", options: ["Sitting", "Standing", "Walking", "Fast walking"] },
  { q: "Did you climb stairs recently?", options: ["Yes", "No"] },
  { q: "Did you exercise today?", options: ["Heavy", "Light", "None"] },
  { q: "Are you feeling anxious right now?", options: ["Yes", "No", "Slightly"] },
  { q: "Is your breathing normal or fast?", options: ["Normal", "Fast", "Very fast"] },
  { q: "Do you have a history of high BP or low BP?", options: ["High", "Low", "Normal", "Not sure"] },
  { q: "Did you eat within the last hour?", options: ["Yes", "No"] },
  { q: "Are you dehydrated?", options: ["Yes", "No", "Maybe"] }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'coach'>('dashboard');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [textInput, setTextInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHandsFree, setIsHandsFree] = useState(false);
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Global Voice Control State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Q&A State
  const [showQaModal, setShowQaModal] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [qaAnswers, setQaAnswers] = useState<{question: string, answer: string}[]>([]);

  // Emergency Mode State
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyEvent[]>([]);
  const recordAndSendVoice = async () => {
  try {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      speakWithPause("Your browser does not support voice recording.");
      return;
    }

    // --- 1. Pause voice recognition ---
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      speakWithPause("Analyzing your voice now.");

      try {
        const res = await fetch("http://127.0.0.1:8000/analyze-voice", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        console.log("Voice Health:", data);

        speakWithPause(
          `Stress level ${data.stress}. Energy level ${data.energy}. Risk level ${data.risk}.`
        );
      } catch (apiErr) {
        console.error(apiErr);
        speakWithPause("Failed to analyze voice.");
      }

      // --- 2. Restart recognition AFTER analysis ---
      if (isVoiceActive && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }

      // Stop mic tracks
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start();
    speakWithPause("Please speak for five seconds.");

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5000);

  } catch (err) {
    console.error(err);
    speakWithPause("Microphone permission error.");
  }
};

  // Get Location on Mount (for emergency readiness)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Sound Feedback Helper
  const playFeedback = (type: 'start' | 'success') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
      } else {
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
      }
      osc.start(now);
      osc.stop(now + 0.2);
    } catch(e) {}
  };

  // Simple Speak
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
       window.speechSynthesis.cancel();
       const u = new SpeechSynthesisUtterance(text);
       window.speechSynthesis.speak(u);
    }
  };

  // Advanced Speak that pauses listening so AI doesn't hear itself
  const speakWithPause = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  try {
    recognitionRef.current?.stop();
  } catch (e) {}

  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);

    utter.onend = () => {
      try {
        recognitionRef.current?.start();
      } catch (e) {}
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, 200);
};


  // Accessibility Helper: Read Page Content
  const readWholePage = () => {
    const content = document.body.innerText.slice(0, 500); // Read first 500 chars to avoid too long speech
    speakWithPause(`Reading screen content: ${content}`);
  };

  // --- MAIN VOICE LOGIC ---
  const startListening = () => {
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
          setVoiceError("Browser not supported");
          return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceActive(true);
        setVoiceError(null);
        playFeedback('start');
        speakWithPause("Hands free active. Listening for commands.");
      };

      recognition.onerror = (e: any) => {
        console.error(e);
        if (e.error === 'not-allowed') setVoiceError("Microphone access denied");
      };

      recognition.onend = () => {
        // Automatically restart if user didn't explicitly stop it
        if (isVoiceActive) {
            try { recognition.start(); } catch (e) {}
        }
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase();
        console.log("Global Voice Command:", transcript);

        // --- 1. ACCESSIBILITY & UI COMMANDS ---
        if (transcript.includes("open menu") || transcript.includes("open sidebar")) {
          setIsSidebarCollapsed(false);
          setShowMobileSidebar(true);
          playFeedback('success');
          speakWithPause("Opening menu");
        } 
        else if (transcript.includes("close menu")) {
          setIsSidebarCollapsed(true);
          setShowMobileSidebar(false);
          playFeedback('success');
          speakWithPause("Closing menu");
        }
        else if (transcript.includes("scroll down")) {
          window.scrollBy({ top: 400, behavior: "smooth" });
          speakWithPause("Scrolling down");
        }
        else if (transcript.includes("scroll up")) {
            window.scrollBy({ top: -400, behavior: "smooth" });
            speakWithPause("Scrolling up");
        }
        else if (transcript.includes("read page") || transcript.includes("read screen")) {
            playFeedback('success');
            readWholePage();
        }
        else if (transcript.includes("go back")) {
            window.history.back();
            speakWithPause("Going back");
        }

        // --- 2. APP NAVIGATION COMMANDS ---
        else if (transcript.includes('history') || transcript.includes('analytics')) {
          setCurrentView('history');
          playFeedback('success');
          speakWithPause("Opening history view");
        } else if (transcript.includes('coach') || transcript.includes('motivation')) {
          setCurrentView('coach');
          playFeedback('success');
          speakWithPause("Opening health coach");
        } else if (transcript.includes('dashboard') || transcript.includes('home')) {
          setCurrentView('dashboard');
          playFeedback('success');
          speakWithPause("Opening dashboard");
        } else if (transcript.includes('log out') || transcript.includes('sign out')) {
          setIsLoggedIn(false);
          playFeedback('success');
        } 

        // --- 3. HEALTH & ANALYSIS COMMANDS ---
        else if (transcript.includes("hello health") || transcript.includes("hey health")) {
            playFeedback('success');
            setTimeout(() => { speakWithPause("I'm listening."); }, 100);
            handleWakeWordDetected();
        } 
        else if (
            transcript.includes("check my health") ||
            transcript.includes("analyze my health") ||
            transcript.includes("start checkup") ||
            transcript.includes("health test")
      ) {
            speakWithPause("Starting your health checkup now.");
            recordAndSendVoice();   // 👉 guided health questions
            return;
      }


        else if (transcript.includes("help") || transcript.includes("emergency")) {
            setIsEmergencyActive(true);
            speak("Emergency mode activated.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setVoiceError("Failed to start microphone");
      setIsVoiceActive(false);
    }
  };

  const stopListening = () => {
    setIsVoiceActive(false); 
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    speak("Hands free disabled.");
  };

  const toggleVoiceControl = () => {
    if (isVoiceActive) stopListening();
    else startListening();
  };

  // Stop listening on logout
  useEffect(() => {
    if (!isLoggedIn) {
       setIsVoiceActive(false);
       if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
    }
  }, [isLoggedIn]);

  // If not logged in, show login page
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalysis = async (overrideText?: string) => {
    const activeText = overrideText || textInput;

    if (!activeText && !csvFile && images.length === 0 && !audioBlob) {
      setErrorMsg("Please provide at least one input (Text, CSV, Image, or Voice).");
      return;
    }
    if (audioBlob) {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");

      const res = await fetch("http://localhost:8000/analyze-voice", {
      method: "POST",
      body: formData,
  });

  const recordAndSendVoice = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      speakWithPause("Analyzing your voice for health patterns.");

      const res = await fetch("http://127.0.0.1:8000/analyze-voice", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      console.log("Voice Health:", data);

      speakWithPause(
        `Your stress level is ${data.stress}. Energy level is ${data.energy}. Overall risk is ${data.risk}.`
      );
    };

    mediaRecorder.start();
    speakWithPause("Please speak for five seconds.");

    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach(t => t.stop());
    }, 5000);

  } catch (err) {
    console.error(err);
    speakWithPause("Microphone error.");
  }
};


  const voiceHealth = await res.json();
  console.log("VOICE HEALTH:", voiceHealth);

  // You can merge this with Gemini result later
}


    setStatus(AnalysisStatus.ANALYZING);
    setErrorMsg(null);

    try {
      const data = await analyzeHealthData(activeText, images, csvFile, audioBlob);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);

      if (data.riskLevel === 'High') {
         setIsEmergencyActive(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze data. Please try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleManualAnalysis = () => {
    setIsHandsFree(false);
    handleAnalysis();
  };

  const handleWakeWordDetected = () => {
    setIsHandsFree(true);
    let commandContext = textInput;
    if (!textInput && !csvFile && images.length === 0 && !audioBlob) {
        commandContext = "User requested immediate vitals check via hands-free voice command.";
    }
    handleAnalysis(commandContext);
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    setTextInput('');
    setCsvFile(null);
    setImages([]);
    setAudioBlob(null);
    setErrorMsg(null);
    setIsHandsFree(false);
  };

  // --- Emergency Handlers ---
  const handleEmergencyConfirm = () => {
    const locString = userLocation ? `Lat:${userLocation.lat},Lng:${userLocation.lng}` : 'Unknown Location';
    alert(`[SIMULATION] Sending SMS to Dr. Smith: "Emergency detected for patient. Location: ${locString}. Please call immediately."`);
    
    const newEvent: EmergencyEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      reason: result?.reasoning || "Manual Trigger",
      location: userLocation,
      status: 'CONTACTED'
    };
    setEmergencyHistory(prev => [newEvent, ...prev]);
    setIsEmergencyActive(false);
  };

  const handleEmergencyCancel = () => {
     const newEvent: EmergencyEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      reason: result?.reasoning || "Manual Trigger",
      location: userLocation,
      status: 'CANCELLED'
    };
    setEmergencyHistory(prev => [newEvent, ...prev]);
    setIsEmergencyActive(false);
  };

  // Q&A Handlers
  const startQaSession = () => {
    setQaAnswers([]);
    setCurrentQIndex(0);
    setShowQaModal(true);
  };

  const handleQaAnswer = (answer: string) => {
    const newAnswers = [...qaAnswers, { question: HEALTH_QUESTIONS[currentQIndex].q, answer }];
    setQaAnswers(newAnswers);

    if (currentQIndex < HEALTH_QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setShowQaModal(false);
      const summary = newAnswers.map(a => `${a.question} ${a.answer}`).join('. ');
      const finalInput = `User completed a guided health checkup. Responses: ${summary}. ${textInput}`;
      handleAnalysis(finalInput);
    }
  };

  // Dashboard Content Component
  const DashboardContent = () => (
    <>
      {status === AnalysisStatus.IDLE || status === AnalysisStatus.ANALYZING || status === AnalysisStatus.ERROR ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Health Risk Prediction</h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Upload your health data, sensor logs, or describe your symptoms. 
              VITA-AI uses multimodal reasoning to provide early warning signs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs Column 1 */}
            <div className="space-y-6">
              
              {/* Text Input with Q&A Button */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Symptoms & Notes
                  </label>
                  <button 
                    onClick={startQaSession}
                    className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors font-semibold"
                  >
                    <ClipboardCheck size={14} />
                    Guided Checkup
                  </button>
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe how you feel, or click 'Guided Checkup' for a step-by-step questionnaire..."
                  className="w-full h-32 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm placeholder:text-slate-400"
                />
                <VoiceInput onAudioRecorded={setAudioBlob} />
              </div>

              {/* CSV Upload */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Upload size={16} className="text-teal-500" />
                  Sensor Data (CSV)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${csvFile ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'}`}>
                    {csvFile ? (
                      <>
                        <FileText size={24} className="text-teal-600 mb-2" />
                        <p className="text-sm font-medium text-teal-700 truncate max-w-full px-4">{csvFile.name}</p>
                        <p className="text-xs text-teal-500 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">Click to upload CSV</p>
                        <p className="text-xs text-slate-400 mt-1">Smartwatch exports, Heart rate logs</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Column 2 */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} className="text-indigo-500" />
                  Medical Images / Vitals
                </label>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt="preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <AlertCircle size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="relative aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Image</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-auto">
                  Upload photos of BP monitors, ECG strips, or visible symptoms.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleManualAnalysis}
            disabled={status === AnalysisStatus.ANALYZING}
            className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3
              ${status === AnalysisStatus.ANALYZING 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.01]'
              }`}
          >
            {status === AnalysisStatus.ANALYZING ? (
              <>
                <Loader2 className="animate-spin" />
                {showQaModal ? "Please wait while I analyze your health status..." : "Analyzing Vitals with Gemini 3 Pro..."}
              </>
            ) : (
              <>
                Run VITA-AI Analysis
                <Activity size={20} />
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            Disclaimer: VITA-AI is a demonstration tool and does not provide medical advice. Consult a doctor for any health concerns.
          </p>
        </div>
      ) : (
        result && <ResultsView result={result} onReset={reset} isHandsFree={isHandsFree} />
      )}
      
      {/* Accessibility Features (Wake Word Listener) */}
      <AccessibilityPoster 
        isListening={isVoiceActive} 
        onToggle={toggleVoiceControl} 
        error={voiceError}
      />
    </>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return <HistoryView />;
      case 'coach':
        return <HealthCoachView lastAnalysis={result} />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 pb-12 animate-in fade-in zoom-in-95 duration-500 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
      
      <EmergencyOverlay 
        isVisible={isEmergencyActive}
        reason={result?.reasoning || "Detected high risk anomalies in vital signs."}
        location={userLocation}
        onConfirm={handleEmergencyConfirm}
        onCancel={handleEmergencyCancel}
      />

      {/* Sidebar (Desktop) */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={() => setIsLoggedIn(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isListening={isVoiceActive}
      />

      {/* Header (Mobile Sidebar Toggle + Title) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 md:hidden">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 -ml-2 text-slate-600">
               <Menu size={24} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500">
              VITA-AI
            </h1>
          </div>
        </div>
        {/* Mobile Sidebar Dropdown */}
        {showMobileSidebar && (
           <div className="border-t border-slate-100 bg-white p-4 space-y-2 shadow-xl animate-in slide-in-from-top-2">
             <button onClick={() => { setCurrentView('dashboard'); setShowMobileSidebar(false); }} className="block w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg">Dashboard</button>
             <button onClick={() => { setCurrentView('history'); setShowMobileSidebar(false); }} className="block w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg">History</button>
             <button onClick={() => { setCurrentView('coach'); setShowMobileSidebar(false); }} className="block w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg text-indigo-600 font-semibold">Health Coach</button>
             <button onClick={() => setIsLoggedIn(false)} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Sign Out</button>
           </div>
        )}
      </header>
      
      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-8">
        {renderContent()}
      </main>
      
      {/* Floating Chat Widget */}
      <ChatWidget />

      {/* Q&A Modal */}
      {showQaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-400" />
                <h3 className="font-semibold">Health Checkup</h3>
              </div>
              <button onClick={() => setShowQaModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-slate-100 w-full">
               <div 
                 className="h-full bg-blue-500 transition-all duration-300 ease-out"
                 style={{ width: `${((currentQIndex + 1) / HEALTH_QUESTIONS.length) * 100}%` }}
               ></div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 block">
                Question {currentQIndex + 1} of {HEALTH_QUESTIONS.length}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                {HEALTH_QUESTIONS[currentQIndex].q}
              </h2>
              
              <div className="space-y-3">
                {HEALTH_QUESTIONS[currentQIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQaAnswer(option)}
                    className="w-full text-left px-5 py-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group"
                  >
                    <span className="text-slate-700 font-medium group-hover:text-blue-700">{option}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;