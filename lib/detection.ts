/**
 * Server-side AI image detection via Hugging Face Inference API.
 * Runs under the hood — not exposed to the frontend user.
 */

const HF_MODEL = process.env.HF_DETECTION_MODEL || 'boluobobo/ItsNotAI-ai-detector-v2';
const HF_FALLBACK_MODEL = 'dima806/ai_vs_real_image_detection';
const LOCAL_API = process.env.LOCAL_PREDICT_URL || 'http://127.0.0.1:5328/api/predict';

export interface DetectionResponse {
  success: true;
  isAI: boolean;
  confidence: number;
  prediction: string;
  details: string;
}

interface HFLabel {
  label: string;
  score: number;
}

function normalizeLabel(label: string): boolean {
  const l = label.toLowerCase();
  return (
    l.includes('ai') ||
    l.includes('fake') ||
    l.includes('generated') ||
    l.includes('synthetic') ||
    l === '1'
  );
}

function parseHFResponse(data: unknown): { isAI: boolean; confidence: number } | null {
  if (!data) return null;

  // Array of {label, score}
  if (Array.isArray(data)) {
    const items = data as HFLabel[];
    if (items.length && 'label' in items[0] && 'score' in items[0]) {
      const aiItem = items.find((i) => normalizeLabel(i.label));
      const realItem = items.find((i) => !normalizeLabel(i.label));
      if (aiItem && realItem) {
        const isAI = aiItem.score >= realItem.score;
        const confidence = Math.round((isAI ? aiItem.score : realItem.score) * 1000) / 10;
        return { isAI, confidence };
      }
      const top = items[0];
      const isAI = normalizeLabel(top.label);
      return { isAI, confidence: Math.round(top.score * 1000) / 10 };
    }

    // Nested array
    if (Array.isArray(data[0])) {
      return parseHFResponse(data[0]);
    }
  }

  // Object with binary / multi-class heads (ItsNotAI v2 style)
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    if (obj.binary_head && Array.isArray(obj.binary_head)) {
      return parseHFResponse(obj.binary_head);
    }
    if (obj.predictions && Array.isArray(obj.predictions)) {
      return parseHFResponse(obj.predictions);
    }
    if (typeof obj.is_ai === 'boolean') {
      return {
        isAI: obj.is_ai,
        confidence: Math.round(Number(obj.confidence ?? obj.score ?? 0.85) * (Number(obj.confidence) <= 1 ? 100 : 1) * 10) / 10,
      };
    }
    if (typeof obj.label === 'string' && typeof obj.score === 'number') {
      const isAI = normalizeLabel(obj.label);
      return { isAI, confidence: Math.round(obj.score * 1000) / 10 };
    }
  }

  return null;
}

async function callHFModel(model: string, imageBytes: Buffer, token: string): Promise<unknown> {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(imageBytes),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Detection API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  return res.json();
}

async function detectWithHuggingFace(imageBase64: string): Promise<DetectionResponse> {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN not configured');

  const imageBytes = Buffer.from(imageBase64, 'base64');

  let data: unknown;
  try {
    data = await callHFModel(HF_MODEL, imageBytes, token);
  } catch {
    data = await callHFModel(HF_FALLBACK_MODEL, imageBytes, token);
  }

  const parsed = parseHFResponse(data);
  if (!parsed) {
    throw new Error('Could not parse detection response');
  }

  const { isAI, confidence } = parsed;
  return {
    success: true,
    isAI,
    confidence,
    prediction: isAI ? 'AI-Generated' : 'Real',
    details: isAI
      ? `Our analysis detected patterns consistent with AI-generated imagery (${confidence}% confidence).`
      : `Our analysis indicates this appears to be authentic photography (${confidence}% confidence).`,
  };
}

async function detectWithLocalFallback(imageBase64: string): Promise<DetectionResponse> {
  const res = await fetch(LOCAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Local detection unavailable');
  }

  const data = await res.json();
  return {
    success: true,
    isAI: data.isAI ?? data.prediction === 'AI-Generated',
    confidence: data.confidence,
    prediction: data.prediction,
    details: data.details || (data.isAI
      ? `Analysis suggests AI-generated content (${data.confidence}% confidence).`
      : `Analysis suggests authentic content (${data.confidence}% confidence).`),
  };
}

export async function detectImage(imageBase64: string): Promise<DetectionResponse> {
  if (process.env.HF_API_TOKEN) {
    try {
      return await detectWithHuggingFace(imageBase64);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Detection] HF API failed, trying local fallback:', err);
        return detectWithLocalFallback(imageBase64);
      }
      throw err;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return detectWithLocalFallback(imageBase64);
  }

  throw new Error(
    'Detection service not configured. Set HF_API_TOKEN in environment variables.'
  );
}
