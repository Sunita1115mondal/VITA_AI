
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface VitalMetrics {
  heartRate: number; // BPM
  respirationRate: number; // Breaths per minute
  systolicBP?: number;
}

export interface AnalysisResult {
  riskLevel: 'Low' | 'Moderate' | 'High';
  fitnessScore: number;
  vitalMetrics: VitalMetrics; // New field for sonification
  reasoning: string;
  recommendations: string[];
  trendSummary: string;
  chartData?: ChartDataPoint[];
}

export interface InputState {
  text: string;
  images: File[];
  csvFile: File | null;
  audioBlob: Blob | null;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isSearch?: boolean;
  groundingLinks?: { title: string; url: string }[];
}

export interface HistoryRecord {
  id: string;
  date: string;
  time: string;
  heartRate: number;
  bloodPressure: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  insight: string;
}

export interface EmergencyEvent {
  id: string;
  timestamp: string;
  reason: string;
  location: { lat: number; lng: number } | null;
  status: 'CANCELLED' | 'CONTACTED' | 'MISSED';
}

export interface CoachInsight {
  motivationalMessage: string;
  personalizedAdvice: string;
  dailyReminders: string[];
  exercisePlan: {
    type: string;
    duration: string;
    intensity: string;
    description: string;
  };
  sleepTracking: {
    quality: string;
    hours: number; // Estimated
    insight: string;
  };
  stressTracking: {
    level: string;
    insight: string;
  };
}
