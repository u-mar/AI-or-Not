import { APP_CONFIG } from './config.js';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',')
        ? result.split(',')[1]
        : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function fetchWithTimeout(url, options, timeout = APP_CONFIG.apiTimeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function analyzeImage(file, model = 'logistic', retryCount = 0) {
  const startTime = performance.now();
  const base64Image = await fileToBase64(file);

  try {
    const response = await fetchWithTimeout(APP_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, model })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error (${response.status})`);
    }

    const result = await response.json();
    const duration = Math.round(performance.now() - startTime);
    const isAI = result.isAI ?? result.prediction === 'AI-Generated';

    return {
      isAI,
      confidence: Math.round(result.confidence * 10) / 10,
      prediction: isAI ? 'AI GENERATED' : 'REAL',
      model: result.model || model,
      modelName: APP_CONFIG.modelName,
      details: result.details || buildDetails(isAI, result.confidence),
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    if (retryCount < APP_CONFIG.maxRetries && error.message.includes('fetch')) {
      await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      return analyzeImage(file, model, retryCount + 1);
    }
    throw error;
  }
}

function buildDetails(isAI, confidence) {
  if (isAI) {
    return `Analysis detected patterns consistent with AI-generated content (${confidence}% confidence). Look for unnatural textures, edge artifacts, and statistical anomalies.`;
  }
  return `Analysis suggests authentic content (${confidence}% confidence). Natural color distribution, edge patterns, and texture features align with real photography.`;
}
