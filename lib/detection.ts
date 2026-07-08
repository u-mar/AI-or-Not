/**
 * Server-side AI image detection.
 * Production (Vercel): Hugging Face API only
 * Local dev: HF API → Python script → local dev server
 */

import path from 'path';

const IS_VERCEL = !!process.env.VERCEL;

const HF_MODELS = [
  {
    id: process.env.HF_DETECTION_MODEL || 'Ateeqq/ai-vs-human-image-detector',
    weight: 0.7,
  },
  {
    id: 'umm-maybe/AI-image-detector',
    weight: 0.3,
  },
].filter(
  (model, index, arr) =>
    !!model.id && arr.findIndex((item) => item.id === model.id) === index
);

/** Minimum AI score (0–1) before labeling as AI-generated */
const AI_THRESHOLD = Number(process.env.AI_DETECTION_THRESHOLD ?? '0.72');

const REAL_LABELS = new Set([
  'real', 'human', 'hum', 'genuine', 'authentic', 'natural', 'photo', '0', 'label_0',
]);
const AI_LABELS = new Set([
  'ai', 'fake', 'artificial', 'synthetic', 'generated', 'deepfake', '1', 'label_1',
  'ai_generated', 'fake_image', 'other_ai',
]);

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

function classifyLabel(label: string): 'ai' | 'real' | 'unknown' {
  const l = label.toLowerCase().trim();

  if (REAL_LABELS.has(l)) return 'real';
  if (AI_LABELS.has(l)) return 'ai';

  if (l.includes('real') || l.includes('human') || l === 'hum') return 'real';
  if (l.includes('fake') || l.includes('artificial') || l.includes('synthetic') || l.includes('generated')) {
    return 'ai';
  }
  if (l === 'ai' || /\bai\b/.test(l)) return 'ai';

  return 'unknown';
}

function extractLabelItems(data: unknown): HFLabel[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    if (data.length && typeof data[0] === 'object' && data[0] !== null && 'label' in data[0]) {
      return data as HFLabel[];
    }
    if (Array.isArray(data[0])) return extractLabelItems(data[0]);
    return [];
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.error) return [];
    if (obj.binary_head) return extractLabelItems(obj.binary_head);
    if (obj.predictions) return extractLabelItems(obj.predictions);
    if (typeof obj.label === 'string' && typeof obj.score === 'number') {
      return [{ label: obj.label, score: obj.score }];
    }
  }

  return [];
}

function parseHFResponse(data: unknown): { isAI: boolean; confidence: number } | null {
  if (!data) return null;

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.is_ai === 'boolean') {
      const conf = Number(obj.confidence ?? obj.score ?? 80);
      return { isAI: obj.is_ai, confidence: conf <= 1 ? Math.round(conf * 1000) / 10 : conf };
    }
  }

  const items = extractLabelItems(data);
  if (!items.length) return null;

  let aiScore = 0;
  let realScore = 0;
  for (const item of items) {
    const kind = classifyLabel(String(item.label));
    if (kind === 'ai') aiScore += item.score;
    else if (kind === 'real') realScore += item.score;
  }

  if (aiScore === 0 && realScore === 0) {
    const top = [...items].sort((a, b) => b.score - a.score)[0];
    const kind = classifyLabel(String(top.label));
    if (kind === 'unknown') return null;
    return { isAI: kind === 'ai', confidence: Math.round(top.score * 1000) / 10 };
  }

  const total = aiScore + realScore;
  const aiRatio = total > 0 ? aiScore / total : 0;
  const isAI = aiRatio >= AI_THRESHOLD;
  const confidence = Math.round((isAI ? aiRatio : 1 - aiRatio) * 1000) / 10;

  return { isAI, confidence: Math.min(99.9, Math.max(1, confidence)) };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchTimeout(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function callHFModel(model: string, imageBytes: Buffer, token?: string, attempt = 0): Promise<unknown> {
  const endpoints = [
    `https://router.huggingface.co/hf-inference/models/${model}`,
    `https://api-inference.huggingface.co/models/${model}`,
  ];
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: new Uint8Array(imageBytes),
        signal: fetchTimeout(60000),
      });

      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid API response (${res.status})`);
      }

      if (res.status === 503 && attempt < 3) {
        const wait = ((data as { estimated_time?: number })?.estimated_time ?? 5) * 1000;
        await sleep(Math.min(wait, 15000));
        return callHFModel(model, imageBytes, token, attempt + 1);
      }

      if (!res.ok) {
        const msg = (data as { error?: string })?.error || text.slice(0, 150);
        throw new Error(msg);
      }

      return data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('HF request failed');
    }
  }

  throw lastError || new Error('HF API unavailable');
}

async function detectWithHuggingFace(imageBase64: string, token?: string): Promise<DetectionResponse> {
  const imageBytes = Buffer.from(imageBase64, 'base64');

  const results = await Promise.all(
    HF_MODELS.map(async (model) => {
      try {
        const data = await callHFModel(model.id, imageBytes, token);
        const parsed = parseHFResponse(data);
        return parsed ? { model: model.id, weight: model.weight, ...parsed } : null;
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (!valid.length) {
    throw new Error('All detection models failed');
  }

  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  const aiWeight = valid.reduce((sum, item) => sum + (item.isAI ? item.weight : 0), 0);
  const aiRatio = totalWeight > 0 ? aiWeight / totalWeight : 0;
  const isAI = aiRatio >= AI_THRESHOLD;
  const confidence = Math.round(((isAI ? aiRatio : 1 - aiRatio) * 1000)) / 10;

  return {
    success: true,
    isAI,
    confidence: Math.min(99.9, Math.max(1, confidence)),
    prediction: isAI ? 'AI-Generated' : 'Real',
    details: isAI
      ? `This image shows signs of AI generation (${confidence}% confidence).`
      : `This image appears to be a real photograph (${confidence}% confidence).`,
  };
}

function runPythonPredict(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Dynamic import — child_process is not available on Vercel serverless
    import('child_process').then(({ spawn }) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'predict.py');
      const proc = spawn('python', [scriptPath], { windowsHide: true });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error('Local model timed out'));
      }, 45000);

      proc.stdout.on('data', (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(stderr.trim() || `Python script exited with code ${code}`));
          return;
        }
        resolve(stdout);
      });

      proc.stdin.write(JSON.stringify({ image: imageBase64 }));
      proc.stdin.end();
    }).catch(reject);
  });
}

async function detectWithPythonScript(imageBase64: string): Promise<DetectionResponse> {
  const stdout = await runPythonPredict(imageBase64);

  const data = JSON.parse(stdout.trim());
  if (data.error) throw new Error(data.message || data.error);

  const isAI = data.isAI ?? data.prediction === 'AI-Generated';
  return {
    success: true,
    isAI,
    confidence: data.confidence,
    prediction: data.prediction,
    details: data.details,
  };
}

async function detectWithLocalServer(imageBase64: string): Promise<DetectionResponse> {
  const res = await fetch(LOCAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
    signal: fetchTimeout(30000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Local server unavailable');
  }

  const data = await res.json();
  const isAI = data.isAI ?? data.prediction === 'AI-Generated';
  return {
    success: true,
    isAI,
    confidence: data.confidence,
    prediction: data.prediction,
    details: data.details,
  };
}

export async function detectImage(imageBase64: string): Promise<DetectionResponse> {
  const errors: string[] = [];
  const token = process.env.HF_API_TOKEN?.trim() || process.env.HF_TOKEN?.trim();

  if (IS_VERCEL && !token) {
    throw new Error(
      'Server not configured. Add HF_API_TOKEN in Vercel → Project Settings → Environment Variables, then redeploy.'
    );
  }

  // 1. Hugging Face API
  try {
    return await detectWithHuggingFace(imageBase64, token || undefined);
  } catch (e) {
    errors.push(`Cloud API: ${e instanceof Error ? e.message : 'failed'}`);
  }

  if (IS_VERCEL) {
    throw new Error(`Detection failed. ${errors.join(' · ')}`);
  }

  // 2. Local Python script (trained model) — dev only
  try {
    return await detectWithPythonScript(imageBase64);
  } catch (e) {
    errors.push(`Local model: ${e instanceof Error ? e.message : 'failed'}`);
  }

  // 3. Local dev server — dev only
  try {
    return await detectWithLocalServer(imageBase64);
  } catch (e) {
    errors.push(`Dev server: ${e instanceof Error ? e.message : 'failed'}`);
  }

  throw new Error(
    token
      ? `Detection failed. ${errors.join(' · ')}`
      : 'Detection is not configured yet. Add HF_API_TOKEN to .env.local (local) or Vercel env vars (production).'
  );
}
