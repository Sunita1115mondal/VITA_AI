import React, { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

interface Props {
  onResult: (data: any) => void;
}

const HealthVoiceRecorder: React.FC<Props> = ({ onResult }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendVoiceToBackend(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Microphone permission denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendVoiceToBackend = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      const res = await fetch("http://127.0.0.1:8000/analyze-voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      const data = await res.json();
      console.log("Voice Health Result:", data);
      onResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Voice analysis failed. Check backend & ffmpeg.");
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <label className="text-sm font-medium text-slate-700">
        Voice Health Check (AI Mode)
      </label>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
          recording
            ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {recording ? <Square size={18} /> : <Mic size={18} />}
        <span className="text-sm font-medium">
          {recording ? "Stop Recording" : "Start Recording"}
        </span>
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
    
  );
};

export default HealthVoiceRecorder;
