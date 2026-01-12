from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import tempfile
import os

app = FastAPI()  # <-- Define app FIRST

# Then add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "VITA-AI Voice API Running"}

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    # save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # load audio using librosa (ffmpeg will decode)
        y, sr = librosa.load(tmp_path, sr=16000)

        # ===== FEATURE EXTRACTION =====
        pitch = np.mean(librosa.yin(y, fmin=50, fmax=300))
        energy = np.mean(librosa.feature.rms(y=y))
        mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr), axis=1)

        # ===== SIMPLE HEALTH LOGIC (demo) =====
        stress = "High" if energy > 0.04 and pitch > 180 else "Normal"
        fatigue = "High" if energy < 0.02 else "Low"

        return {
            "pitch": float(pitch),
            "energy": float(energy),
            "stress_level": stress,
            "fatigue_level": fatigue
        }

    finally:
        os.remove(tmp_path)
