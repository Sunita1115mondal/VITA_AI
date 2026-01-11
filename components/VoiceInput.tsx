import React, { useState } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceInputProps {
  onVoiceText: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceText }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = () => {
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input not supported in this browser. Use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onVoiceText(text); // 👉 send text to parent
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech error:", e);
      setError("Could not recognize speech. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <label className="text-sm font-medium text-slate-700">
        Voice Input (Fast Mode)
      </label>

      <button
        onClick={startListening}
        disabled={isListening}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
          isListening
            ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {isListening ? <Square size={18} /> : <Mic size={18} />}
        <span className="text-sm font-medium">
          {isListening ? "Listening..." : "Speak"}
        </span>
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default VoiceInput;
