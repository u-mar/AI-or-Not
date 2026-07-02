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
  validExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  historyKey: 'aiornot_history',
  settingsKey: 'aiornot_settings',
  maxHistoryItems: 100,
  analysisSteps: [
  'Scanning image...',
  'Extracting features...',
  'Analyzing texture...',
  'Checking edges...',
  'Evaluating statistical properties...',
  'Generating prediction...'
  ]
};
