'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { APP_CONFIG } from '@/lib/config';
import {
  analyzeImage,
  createThumbnail,
  formatFileSize,
  validateImageFile,
} from '@/lib/api';
import { addHistoryItem } from '@/lib/storage';
import { IconCamera, IconGallery, IconImage } from './icons';
import { useToast } from './useToast';

export default function DetectorClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeImage>> | null>(null);
  const [error, setError] = useState('');
  const { show, ToastContainer } = useToast();

  const handleFile = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      const err = validateImageFile(f);
      if (err) {
        setValidation(err);
        show(err, 'error');
        return;
      }
      setValidation('');
      setFile(f);
      setResult(null);
      setError('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [previewUrl, show]
  );

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setAnalyzing(false);
    setStatusText('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setError('');
    setStatusText('Preparing image...');

    // Animate status while API runs in parallel
    const steps = APP_CONFIG.analysisSteps;
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      setStatusText(steps[stepIdx % steps.length]);
      stepIdx++;
    }, 800);

    try {
      const res = await analyzeImage(file);
      clearInterval(stepTimer);
      const thumb = await createThumbnail(file);
      addHistoryItem({
        thumbnail: thumb,
        prediction: res.prediction,
        isAI: res.isAI,
        confidence: res.confidence,
        model: res.modelName,
        duration: res.duration,
        fileName: file.name,
      });
      setResult(res);
    } catch (e) {
      clearInterval(stepTimer);
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setError(msg);
      show(msg, 'error');
    } finally {
      setAnalyzing(false);
      setStatusText('');
    }
  };

  const phase = result ? 'result' : error ? 'error' : analyzing ? 'analyzing' : file ? 'preview' : 'empty';

  return (
    <>
      <ToastContainer />
      <div className="detect-app">
        {/* Empty state */}
        {phase === 'empty' && (
          <div className="detect-hero-card">
            <div className="detect-hero-glow" aria-hidden="true" />
            <div className="detect-hero-icon">
              <IconImage />
            </div>
            <h2 className="detect-hero-title">Check any image</h2>
            <p className="detect-hero-desc">
              Instantly find out if a photo is real or AI-generated
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="detect-hero-actions">
              <button type="button" className="detect-btn detect-btn-primary" onClick={() => cameraInputRef.current?.click()}>
                <IconCamera />
                <span>Take Photo</span>
              </button>
              <button type="button" className="detect-btn detect-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <IconGallery />
                <span>From Gallery</span>
              </button>
            </div>
            <p className="detect-formats">JPEG · PNG · WEBP · max 10MB</p>
          </div>
        )}

        {/* Preview + analyze */}
        {(phase === 'preview' || phase === 'analyzing') && previewUrl && (
          <div className="detect-preview-card">
            <div className="detect-image-wrap">
              <img src={previewUrl} alt="Selected" className="detect-image" />
              {phase === 'analyzing' && (
                <div className="detect-overlay">
                  <div className="detect-overlay-spinner" />
                  <p>{statusText}</p>
                </div>
              )}
            </div>
            <div className="detect-file-chip">
              <span className="detect-file-name">{file?.name}</span>
              <span className="detect-file-size">{file && formatFileSize(file.size)}</span>
            </div>
            {phase === 'preview' && (
              <div className="detect-preview-actions">
                <button type="button" className="detect-btn detect-btn-primary detect-btn-full" onClick={runAnalysis}>
                  Analyze Image
                </button>
                <button type="button" className="detect-btn detect-btn-text" onClick={reset}>
                  Choose another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && previewUrl && (
          <div className={`detect-result-card ${result.isAI ? 'ai' : 'real'}`}>
            <div className="detect-result-image-wrap">
              <img src={previewUrl} alt="" className="detect-result-thumb" />
              <div className={`detect-result-badge ${result.isAI ? 'ai' : 'real'}`}>
                {result.isAI ? 'AI' : 'REAL'}
              </div>
            </div>

            <div className="detect-result-body">
              <h2 className="detect-result-title">
                {result.isAI ? 'AI Generated' : 'Real Photo'}
              </h2>
              <p className="detect-result-sub">
                {result.isAI
                  ? 'This image shows signs of AI generation'
                  : 'This image appears authentic'}
              </p>

              <div className="detect-confidence">
                <div className="detect-confidence-header">
                  <span>Confidence</span>
                  <strong>{result.confidence}%</strong>
                </div>
                <div className="detect-confidence-track">
                  <div
                    className="detect-confidence-fill"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <div className="detect-result-actions">
                <button type="button" className="detect-btn detect-btn-primary detect-btn-full" onClick={reset}>
                  Scan Another
                </button>
                <Link href="/history" className="detect-btn detect-btn-secondary detect-btn-full">
                  View History
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="detect-error-card">
            <div className="detect-error-icon">!</div>
            <h3>Couldn&apos;t analyze image</h3>
            <p>{error}</p>
            {error.includes('HF_API_TOKEN') && (
              <p className="detect-error-hint">
                Create <code>.env.local</code> in the project root with your free token, then restart <code>npm run dev</code>.
              </p>
            )}
            <button type="button" className="detect-btn detect-btn-primary detect-btn-full" onClick={file ? runAnalysis : reset}>
              {file ? 'Try Again' : 'Start Over'}
            </button>
          </div>
        )}

        {validation && <p className="detect-validation">{validation}</p>}
      </div>
    </>
  );
}
