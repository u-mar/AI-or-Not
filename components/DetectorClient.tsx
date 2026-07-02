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
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
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
    setActiveStep(-1);
    setDoneSteps([]);
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
    setDoneSteps([]);
    setActiveStep(0);

    for (let i = 0; i < APP_CONFIG.analysisSteps.length; i++) {
      setActiveStep(i);
      await new Promise((r) => setTimeout(r, 350));
      setDoneSteps((d) => [...d, i]);
    }
    setActiveStep(-1);

    try {
      const res = await analyzeImage(file);
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
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const showResults = analyzing || result || error;

  return (
    <>
      <ToastContainer />
      <div className="detect-flow">
        {!file && !showResults && (
          <div className="detect-empty">
            <div className="detect-empty-icon" aria-hidden="true">
              <IconImage />
            </div>
            <p className="detect-empty-text">Add a photo to analyze</p>
            <p className="detect-empty-hint">PNG, JPEG, WEBP · up to 10MB</p>

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

            <div className="detect-actions">
              <button
                type="button"
                className="app-action-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconGallery />
                <span>Gallery</span>
              </button>
              <button
                type="button"
                className="app-action-btn primary"
                onClick={() => cameraInputRef.current?.click()}
              >
                <IconCamera />
                <span>Camera</span>
              </button>
            </div>
          </div>
        )}

        {file && !showResults && (
          <div className="detect-preview">
            <div className="preview-frame">
              {previewUrl && (
                <img src={previewUrl} alt="Selected" className="preview-image" />
              )}
            </div>
            <div className="preview-info">
              <span className="preview-name">{file.name}</span>
              <span className="preview-size">{formatFileSize(file.size)}</span>
            </div>
            <button type="button" className="preview-change" onClick={reset}>
              Choose different photo
            </button>
          </div>
        )}

        {analyzing && !result && !error && (
          <div className="detect-status" aria-live="polite">
            <div className="status-spinner" aria-hidden="true" />
            <p className="status-label">
              {APP_CONFIG.analysisSteps[activeStep >= 0 ? activeStep : 0]}
            </p>
            <div className="status-steps">
              {APP_CONFIG.analysisSteps.map((_, i) => (
                <span
                  key={i}
                  className={`status-dot${doneSteps.includes(i) ? ' done' : ''}${activeStep === i ? ' active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`detect-result${result.isAI ? ' is-ai' : ' is-real'}`}>
            <div className="result-verdict">
              <span className="result-icon" aria-hidden="true">
                {result.isAI ? '✦' : '✓'}
              </span>
              <h2>{result.isAI ? 'AI Generated' : 'Real'}</h2>
              <p className="result-conf">{result.confidence}% confidence</p>
            </div>
            <div className="result-bar">
              <div className="result-bar-fill" style={{ width: `${result.confidence}%` }} />
            </div>
            <div className="result-details-grid">
              <div><span>Analysis</span><strong>{result.duration}ms</strong></div>
              <div><span>Confidence</span><strong>{result.confidence}%</strong></div>
            </div>
            <div className="detect-actions vertical">
              <button type="button" className="app-action-btn primary full" onClick={reset}>
                Scan Another
              </button>
              <Link href="/history" className="app-action-btn full">
                View History
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="detect-error" role="alert">
            <span className="error-icon" aria-hidden="true">!</span>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="app-action-btn primary full" onClick={runAnalysis}>
              Try Again
            </button>
          </div>
        )}

        {validation && <p className="detect-validation" role="alert">{validation}</p>}
      </div>

      {file && !showResults && (
        <div className="app-fab-bar">
          <button
            type="button"
            className="app-fab"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            Analyze
          </button>
        </div>
      )}
    </>
  );
}
