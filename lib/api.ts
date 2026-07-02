import { APP_CONFIG, type AnalysisResult } from './config';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = APP_CONFIG.apiTimeout
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function analyzeImage(
  file: File,
  model = 'logistic',
  retryCount = 0
): Promise<AnalysisResult> {
  const startTime = performance.now();
  const base64Image = await fileToBase64(file);

  try {
    const response = await fetchWithTimeout(APP_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string; error?: string }).message ||
          (errorData as { error?: string }).error ||
          `Server error (${response.status})`
      );
    }

    const result = await response.json();
    const duration = Math.round(performance.now() - startTime);
    const isAI = result.isAI ?? result.prediction === 'AI-Generated';

    return {
      isAI,
      confidence: Math.round(result.confidence * 10) / 10,
      prediction: isAI ? 'AI GENERATED' : 'REAL',
      model: 'engine',
      modelName: APP_CONFIG.modelName,
      details: result.details || (isAI
        ? `This image shows signs of AI generation (${Math.round(result.confidence)}% confidence).`
        : `This image appears to be authentic (${Math.round(result.confidence)}% confidence).`),
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    if (retryCount < APP_CONFIG.maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      return analyzeImage(file, model, retryCount + 1);
    }
    throw error instanceof Error ? error : new Error('Analysis failed');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function validateImageFile(file: File): string | null {
  if (!(APP_CONFIG.validImageTypes as readonly string[]).includes(file.type)) {
    return 'Invalid format. Please upload PNG, JPEG, JPG, or WEBP images only.';
  }
  if (file.size > APP_CONFIG.maxFileSize) {
    return `File too large. Maximum size is ${formatFileSize(APP_CONFIG.maxFileSize)}.`;
  }
  return null;
}

export async function createThumbnail(file: File, max = 120): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(max / img.width, max / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
}
