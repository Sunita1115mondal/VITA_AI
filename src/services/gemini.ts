import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, ChatMessage, CoachInsight } from "../types";
import { fileToGenerativePart, blobToBase64, readFileAsText } from "../utils/helpers";

const ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";
const SEARCH_MODEL = "gemini-2.5-flash";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const COACH_MODEL = "gemini-2.5-flash"; // Fast and creative for coaching

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY});

export const analyzeHealthData = async (
  text: string,
  images: File[],
  csvFile: File | null,
  audioBlob: Blob | null
): Promise<AnalysisResult> => {
  const parts: any[] = [];

  // Construct a comprehensive system prompt based on VITA-AI specifications
  let promptText = `
    SYSTEM IDENTITY:
    You are VITA-AI, an advanced multimodal early health-risk and fitness prediction system powered by Gemini 3 Pro.

    CORE RESPONSIBILITIES:
    1. Parse and summarize sensor data (detect patterns like fatigue, shakiness, instability, overexertion, abnormal gait).
    2. Extract vitals from images (OCR for BP, HR, SpO2).
    3. Correlate motion + vitals + symptoms using multimodal reasoning.
    4. Predict early warning signs for: Hypertension risk, Low oxygen levels, Stress/fatigue, Sedentary behavior.
    5. Calculate a Daily Fitness Score (0–100).
    6. Explain all reasoning in clear, simple human language.
    7. Provide personalized recommendations (Exercise, Hydration, Sleep, Rest, When to consult a doctor).
    8. If historical data is provided, detect trends.

    ANALYSIS INSTRUCTIONS PER MODALITY:

    [SENSOR DATA ANALYSIS]
    If CSV/Sensor data is provided:
    1. Summarize the data.
    2. Identify abnormal patterns (shaking, sudden drops, inconsistent walking).
    3. Evaluate Stability, Fatigue, Mobility stress, Activity intensity.
    4. Generate movement-health insights: Motion quality, Balance/stability, Physical load, Possible risks.

    [IMAGE (VITALS) ANALYSIS]
    If Images are provided:
    1. Extract numbers using OCR (Blood Pressure, Heart Rate, Oxygen Saturation).
    2. Interpret BP ranges (normal / elevated / high).
    3. Analyze oxygen and heart-rate levels.
    4. Assess lifestyle risk and physical strain (Do not diagnose).

    [TEXT / SYMPTOM INPUT]
    Interpret symptoms or daily notes. Extract: Energy level, Stress, Sleep, Diet, Physical activity, Pain/discomfort.

    [VOICE INPUT]
    If audio is provided, transcribe it internally and treat it as text input describing symptoms or activity. Extract key health-related signals.

    OUTPUT REQUIREMENT:
    You must output a single JSON object matching the schema provided.
    - 'riskLevel': "Low", "Moderate", or "High".
    - 'fitnessScore': Integer 0-100.
    - 'vitalMetrics': Object containing 'heartRate' (integer) and 'respirationRate' (integer). IF EXACT DATA IS MISSING, ESTIMATE these based on the risk level and symptoms (e.g., High anxiety -> High HR).
    - 'reasoning': A comprehensive text field that includes your "Early Health Risk Analysis" (BP, Oxygen, Fatigue, Motion risks), "Key Findings", and "Reasoning Summary".
    - 'recommendations': A list of actionable lifestyle guidance.
    - 'trendSummary': A summary of trends if historical data is present (or "No historical data available").
    - 'chartData': Optional data points to visualize the most significant trend found.

    TONE & SAFETY:
    - Be accurate, empathetic, and concise.
    - NEVER give a medical diagnosis. Only provide risk indications and lifestyle guidance.
    
    USER INPUTS:
    Text Notes: "${text || "No text notes provided."}"
  `;

  if (csvFile) {
    try {
      const csvText = await readFileAsText(csvFile);
      // Truncate to avoid extremely large payloads, though Gemini 3 Pro context is large.
      promptText += `\n\n[ATTACHED CSV SENSOR DATA START]\n${csvText.slice(0, 100000)}\n[ATTACHED CSV SENSOR DATA END]\n`;
    } catch (e) {
      console.error("Error reading CSV", e);
      promptText += `\n\n[ERROR READING CSV FILE]`;
    }
  }

  // Add the text prompt as the first part
  parts.push({ text: promptText });

  // Add Images
  for (const img of images) {
    try {
      const imagePart = await fileToGenerativePart(img);
      parts.push(imagePart);
    } catch (e) {
      console.error("Error processing image", e);
    }
  }

  // Add Audio
  if (audioBlob) {
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      parts.push({
        inlineData: {
          data: audioBase64,
          mimeType: audioBlob.type || 'audio/webm',
        },
      });
    } catch (e) {
      console.error("Error processing audio", e);
    }
  }

  // Schema matches the types.ts AnalysisResult interface
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      riskLevel: {
        type: Type.STRING,
        enum: ["Low", "Moderate", "High"],
        description: "The overall health risk assessment.",
      },
      fitnessScore: {
        type: Type.INTEGER,
        description: "A calculated daily fitness score from 0 to 100 based on activity and vitals.",
      },
      vitalMetrics: {
        type: Type.OBJECT,
        properties: {
          heartRate: { type: Type.INTEGER, description: "Estimated or extracted Heart Rate (BPM)." },
          respirationRate: { type: Type.INTEGER, description: "Estimated or extracted Respiration Rate (breaths/min)." },
          systolicBP: { type: Type.INTEGER, description: "Estimated or extracted Systolic BP (optional)." }
        },
        required: ["heartRate", "respirationRate"]
      },
      reasoning: {
        type: Type.STRING,
        description: "Detailed explanation covering early health risks (BP, Oxygen, Fatigue, Motion), key findings, and reasoning summary.",
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of personalized, actionable lifestyle or medical recommendations.",
      },
      trendSummary: {
        type: Type.STRING,
        description: "A summary of health trends observed in the data, or a statement if no historical data is available.",
      },
      chartData: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: "Time label (e.g. 'Mon', '10:00')" },
            value: { type: Type.NUMBER, description: "Metric value" }
          }
        },
        description: "Optional data points for visualizing a key trend if detected."
      }
    },
    required: ["riskLevel", "fitnessScore", "vitalMetrics", "reasoning", "recommendations", "trendSummary"],
  };

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      // Increased thinking budget for complex multimodal correlation tasks
      thinkingConfig: { thinkingBudget: 2048 }, 
    },
  });

  if (!response.text) {
    throw new Error("No response from VITA-AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
};

// Chat Feature
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  useSearch: boolean
): Promise<{ text: string; groundingLinks?: { title: string; url: string }[] }> => {
  const modelName = useSearch ? SEARCH_MODEL : CHAT_MODEL;
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;

  const chat = ai.chats.create({
    model: modelName,
    config: {
      tools,
      systemInstruction: "You are VITA-AI's helpful health assistant. Answer questions about fitness, health, and wellness. Be concise, empathetic, and supportive. If search tools are available, use them to provide up-to-date medical information."
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  const result = await chat.sendMessage({ message: newMessage });

  // Extract grounding metadata if available (for Search)
  let groundingLinks: { title: string; url: string }[] = [];
  
  if (useSearch) {
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          groundingLinks.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });
    }
  }

  return {
    text: result.text || "I couldn't generate a response.",
    groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
  };
};

// TTS Feature
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio generated");
  }
  return base64Audio;
};

// Health Coach Feature
export const getHealthCoachAdvice = async (
  lastAnalysis: AnalysisResult | null
): Promise<CoachInsight> => {
  
  let context = "No recent specific health data available. Assume a general wellness context for a user looking to improve fitness and mental health.";

  if (lastAnalysis) {
    const hr = lastAnalysis.vitalMetrics?.heartRate ?? "Unknown";
    context = `User's latest health analysis: Risk Level: ${lastAnalysis.riskLevel}, Fitness Score: ${lastAnalysis.fitnessScore}/100, HR: ${hr} bpm. Issues: ${lastAnalysis.reasoning}`;
  }

  const prompt = `
    You are an energetic, empathetic, and highly motivating AI Health Coach.
    Based on the following user context, generate a personalized daily dashboard plan.
    
    CONTEXT:
    ${context}

    REQUIREMENTS:
    1. Motivational Message: A unique, uplifting, short message to start the day. MUST be different every time.
    2. Personalized Advice: Specific health tip based on the risk level (or general wellness if low risk).
    3. Daily Reminders: 3 actionable, short reminders (e.g., "Drink 2L water", "Take a 10m walk").
    4. Exercise Plan: A suggested workout based on their fitness score/risk (e.g., Yoga for high stress, HIIT for high fitness).
    5. Sleep & Stress Tracking: ESTIMATE or SIMULATE a sleep quality and stress level analysis based on the context (e.g. if HR is high, stress is likely high). Provide a brief insight.

    OUTPUT JSON SCHEMA:
    {
      "motivationalMessage": "string",
      "personalizedAdvice": "string",
      "dailyReminders": ["string", "string", "string"],
      "exercisePlan": {
        "type": "string (e.g., Yoga, Cardio)",
        "duration": "string (e.g., 20 mins)",
        "intensity": "string (Low/Medium/High)",
        "description": "string"
      },
      "sleepTracking": {
        "quality": "string (Good/Fair/Poor)",
        "hours": number,
        "insight": "string"
      },
      "stressTracking": {
        "level": "string (Low/Medium/High)",
        "insight": "string"
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: COACH_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          motivationalMessage: { type: Type.STRING },
          personalizedAdvice: { type: Type.STRING },
          dailyReminders: { type: Type.ARRAY, items: { type: Type.STRING } },
          exercisePlan: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              duration: { type: Type.STRING },
              intensity: { type: Type.STRING },
              description: { type: Type.STRING },
            }
          },
          sleepTracking: {
             type: Type.OBJECT,
             properties: {
               quality: { type: Type.STRING },
               hours: { type: Type.NUMBER },
               insight: { type: Type.STRING }
             }
          },
          stressTracking: {
             type: Type.OBJECT,
             properties: {
               level: { type: Type.STRING },
               insight: { type: Type.STRING }
             }
          }
        },
        required: ["motivationalMessage", "personalizedAdvice", "dailyReminders", "exercisePlan", "sleepTracking", "stressTracking"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Coach failed to respond");
  }

  // Safe Parsing and Sanitization Helper
  const data = JSON.parse(response.text);
  
  // Helper to ensure values are strings (prevents [object Object] rendering errors)
  const safeStr = (val: any) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return JSON.stringify(val); // Fallback for debugging
    return '';
  };

  return {
    motivationalMessage: safeStr(data.motivationalMessage),
    personalizedAdvice: safeStr(data.personalizedAdvice),
    dailyReminders: Array.isArray(data.dailyReminders) ? data.dailyReminders.map(safeStr) : [],
    exercisePlan: {
      type: safeStr(data.exercisePlan?.type),
      duration: safeStr(data.exercisePlan?.duration),
      intensity: safeStr(data.exercisePlan?.intensity),
      description: safeStr(data.exercisePlan?.description),
    },
    sleepTracking: {
      quality: safeStr(data.sleepTracking?.quality),
      hours: Number(data.sleepTracking?.hours) || 7,
      insight: safeStr(data.sleepTracking?.insight),
    },
    stressTracking: {
      level: safeStr(data.stressTracking?.level),
      insight: safeStr(data.stressTracking?.insight),
    }
  } as CoachInsight;
};
