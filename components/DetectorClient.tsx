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
import { useToast } from './useToast';

export default function DetectorClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState('');
  const [dragover, setDragover] = useState(false);
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
      await new Promise((r) => setTimeout(r, 400));
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

  return (
    <>
      <ToastContainer />
      <div className="detector-card glass-card">
        {!file ? (
          <div
            className={`upload-zone${dragover ? ' dragover' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={(e) => { e.preventDefault(); setDragover(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="upload-icon" aria-hidden="true">📤</div>
            <h3>Drag &amp; Drop Your Image</h3>
            <p>or click to browse from your device</p>
            <p className="upload-formats">PNG · JPEG · JPG · WEBP · Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              capture="environment"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="upload-actions">
              <button type="button" className="btn btn-primary btn-ripple btn-block" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Choose Image
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-ripple btn-block mobile-camera-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
              >
                Take Photo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="preview-header">
              <h3>Image Preview</h3>
              <button type="button" className="btn btn-ghost" onClick={reset}>Remove</button>
            </div>
            <div className="preview-container">
              {previewUrl && <img src={previewUrl} alt={`Preview of ${file.name}`} className="preview-image" />}
            </div>
            <div className="file-meta">
              <span className="file-meta-name">{file.name}</span>
              <span className="file-meta-size">{formatFileSize(file.size)} · {file.type.split('/')[1].toUpperCase()}</span>
            </div>
            <div className="preview-actions">
              <button type="button" className="btn btn-primary btn-lg btn-ripple btn-block" onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Analyze Image'}
              </button>
            </div>
          </>
        )}
        {validation && <div className="validation-msg error" role="alert">{validation}</div>}
      </div>

      {(analyzing || result || error) && (
        <div style={{ maxWidth: 720, margin: '2rem auto 0' }} aria-live="polite">
          {analyzing && !result && !error && (
            <div className="analysis-progress glass-card">
              <ul className="analysis-steps" aria-label="Analysis progress">
                {APP_CONFIG.analysisSteps.map((text, i) => (
                  <li
                    key={text}
                    className={`analysis-step${activeStep === i ? ' active' : ''}${doneSteps.includes(i) ? ' done' : ''}`}
                  >
                    <span className="step-icon" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div className={`result-card glass-card reveal revealed ${result.isAI ? 'result-ai' : 'result-real'}`}>
              <div className="result-badge" aria-hidden="true">{result.isAI ? '🤖' : '✓'}</div>
              <h2 className="result-label">{result.prediction}</h2>
              <div className="result-confidence">
                <div className="confidence-bar" role="progressbar" aria-valuenow={result.confidence} aria-valuemin={0} aria-valuemax={100}>
                  <div className="confidence-fill" style={{ width: `${result.confidence}%` }} />
                </div>
                <span className="confidence-value">{result.confidence}% confidence</span>
              </div>
              <div className="result-meta">
                <div className="meta-item"><span className="meta-label">Model</span><span>{result.modelName}</span></div>
                <div className="meta-item"><span className="meta-label">Duration</span><span>{result.duration}ms</span></div>
                <div className="meta-item"><span className="meta-label">Analyzed</span><span>{new Date(result.timestamp).toLocaleString()}</span></div>
              </div>
              <p className="result-details">{result.details}</p>
              <div className="result-actions">
                <button type="button" className="btn btn-primary btn-ripple btn-block" onClick={reset}>Analyze Another</button>
                <Link href="/history" className="btn btn-ghost btn-block">View History</Link>
              </div>
            </div>
          )}

          {error && (
            <div className="error-card glass-card reveal revealed" role="alert">
              <div className="error-icon" aria-hidden="true">⚠</div>
              <h3>Analysis Failed</h3>
              <p>{error}</p>
              <button type="button" className="btn btn-primary btn-ripple" onClick={runAnalysis}>Try Again</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
