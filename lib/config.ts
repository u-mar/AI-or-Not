export const APP_CONFIG = {
  name: 'AI or Not',
  version: '2.0.0',
  modelVersion: '1.0.0',
  modelName: 'Logistic Regression',
  apiEndpoint: '/api/predict',
  apiTimeout: 30000,
  maxRetries: 2,
  maxFileSize: 10 * 1024 * 1024,
  validImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  historyKey: 'aiornot_history',
  settingsKey: 'aiornot_settings',
  usersKey: 'aiornot_users',
  sessionKey: 'aiornot_session',
  sessionDays: 30,
  maxHistoryItems: 100,
  analysisSteps: [
    'Scanning image...',
    'Extracting features...',
    'Analyzing texture...',
    'Checking edges...',
    'Evaluating statistical properties...',
    'Generating prediction...',
  ],
} as const;

export type Theme = 'dark' | 'light';

export interface Settings {
  theme: Theme;
  notifications: boolean;
}

export interface HistoryItem {
  id: string;
  thumbnail: string;
  prediction: string;
  isAI: boolean;
  confidence: number;
  model: string;
  duration: number;
  fileName: string;
  date: string;
}

export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  prediction: string;
  model: string;
  modelName: string;
  details: string;
  duration: number;
  timestamp: string;
}
