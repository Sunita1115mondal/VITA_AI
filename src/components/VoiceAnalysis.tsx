import React, { useState } from "react";

interface VoiceAnalysisProps {
  onResult: (data: any) => void;
}

const VoiceAnalysis: React.FC<VoiceAnalysisProps> = ({ onResult }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const recordAndAnalyze = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert("Browser does not support voice recording.");
        return;
      }

      setLoading(true);
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");

        try {
          const res = await fetch("http://127.0.0.1:8000/analyze-voice", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server returned ${res.status}: ${text}`);
          }

          const data = await res.json();
          setResult(data);
          onResult(data);
        } catch (err) {
          console.error(err);
          setResult({ error: "Failed to analyze voice" });
        } finally {
          setLoading(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    } catch (err) {
      console.error(err);
      alert("Microphone error: " + err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={recordAndAnalyze}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze Voice Health"}
      </button>

      {result && !result.error && (
        <div className="bg-white p-4 rounded-md shadow-md border border-slate-200">
          <h3 className="font-semibold text-lg mb-2">Voice Health Analysis</h3>
          <p><strong>Stress Level:</strong> {result.stress_level}</p>
          <p><strong>Fatigue Level:</strong> {result.fatigue_level}</p>
          <p><strong>Pitch:</strong> {result.pitch.toFixed(2)}</p>
          <p><strong>Energy:</strong> {result.energy.toFixed(4)}</p>
        </div>
      )}

      {result && result.error && (
        <div className="text-red-600 font-medium">{result.error}</div>
      )}
    </div>
  );
};

export default VoiceAnalysis;
