/**
 * Server-side AI image detection.
 * Production (Vercel): Hugging Face API only
 * Local dev: HF API → Python script → local dev server
 */

import path from 'path';

const IS_VERCEL = !!process.env.VERCEL;

const HF_MODELS = [
  process.env.HF_DETECTION_MODEL || 'dima806/ai_vs_real_image_detection',
  'boluobobo/ItsNotAI-ai-detector-v2',
  'umm-maybe/AI-image-detector',
];

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
    l.includes('artificial') ||
    l === '1' ||
    l === 'fake_image' ||
    l === 'ai_generated'
  );
}

function parseHFResponse(data: unknown): { isAI: boolean; confidence: number } | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    const items = data as HFLabel[];
    if (items.length && typeof items[0] === 'object' && items[0] !== null && 'label' in items[0]) {
      const aiItem = items.find((i) => normalizeLabel(String(i.label)));
      const realItem = items.find((i) => !normalizeLabel(String(i.label)));
      if (aiItem && realItem) {
        const isAI = aiItem.score >= realItem.score;
        const confidence = Math.round((isAI ? aiItem.score : realItem.score) * 1000) / 10;
        return { isAI, confidence: Math.min(99.9, Math.max(50, confidence)) };
      }
      const top = items[0];
      const isAI = normalizeLabel(String(top.label));
      return { isAI, confidence: Math.round(top.score * 1000) / 10 };
    }
    if (Array.isArray(data[0])) return parseHFResponse(data[0]);
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.error) return null;
    if (obj.binary_head) return parseHFResponse(obj.binary_head);
    if (obj.predictions) return parseHFResponse(obj.predictions);
    if (typeof obj.is_ai === 'boolean') {
      const conf = Number(obj.confidence ?? obj.score ?? 80);
      return { isAI: obj.is_ai, confidence: conf <= 1 ? Math.round(conf * 1000) / 10 : conf };
    }
    if (typeof obj.label === 'string' && typeof obj.score === 'number') {
      return { isAI: normalizeLabel(obj.label), confidence: Math.round(obj.score * 1000) / 10 };
    }
  }

  return null;
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
  let lastError: Error | null = null;

  for (const model of HF_MODELS) {
    try {
      const data = await callHFModel(model, imageBytes, token);
      const parsed = parseHFResponse(data);
      if (!parsed) continue;

      const { isAI, confidence } = parsed;
      return {
        success: true,
        isAI,
        confidence,
        prediction: isAI ? 'AI-Generated' : 'Real',
        details: isAI
          ? `Detected signs of AI-generated imagery (${confidence}% confidence).`
          : `Appears to be authentic photography (${confidence}% confidence).`,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('HF API failed');
    }
  }

  throw lastError || new Error('All detection models failed');
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
