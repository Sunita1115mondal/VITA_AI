from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tempfile
from pydub import AudioSegment
import librosa
import os
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    contents = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_webm:
        tmp_webm.write(contents)
        tmp_webm.flush()

    # Convert webm → wav
    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    audio = AudioSegment.from_file(tmp_webm.name, format="webm")
    audio.export(tmp_wav.name, format="wav")

    # Load wav into librosa
    y, sr = librosa.load(tmp_wav.name, sr=16000)

    # ---- FEATURE EXTRACTION ----
    pitch = np.mean(librosa.yin(y, fmin=50, fmax=300))
    energy = np.mean(librosa.feature.rms(y=y))
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr), axis=1)

    # ---- SIMPLE HEALTH HEURISTICS (demo) ----
    stress = "High" if energy > 0.04 and pitch > 180 else "Normal"
    fatigue = "High" if energy < 0.02 else "Low"

    # clean temp files
    tmp_webm.close()
    tmp_wav.close()
    os.remove(tmp_webm.name)
    os.remove(tmp_wav.name)

    return {
        "pitch": float(pitch),
        "energy": float(energy),
        "stress_level": stress,
        "fatigue_level": fatigue
    }
