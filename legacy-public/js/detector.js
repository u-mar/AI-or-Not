import { APP_CONFIG } from './config.js';
import { analyzeImage } from './api.js';
import { addHistoryItem } from './storage.js';
import { formatFileSize, showToast, escapeHtml } from './ui.js';

let currentFile = null;
let previewUrl = null;

export function initDetector() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const uploadSection = document.getElementById('uploadSection');
  const previewSection = document.getElementById('previewSection');
  const previewContainer = document.getElementById('previewContainer');
  const removeBtn = document.getElementById('removeBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');
  const fileInfo = document.getElementById('fileInfo');
  const validationMsg = document.getElementById('validationMsg');

  if (!uploadArea) return;

  browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  uploadArea.addEventListener('click', () => fileInput?.click());
  uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput?.click();
    }
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput?.addEventListener('change', (e) => handleFile(e.target.files[0]));

  removeBtn?.addEventListener('click', resetUpload);
  analyzeBtn?.addEventListener('click', runAnalysis);

  function validateFile(file) {
    if (!file) return 'No file selected.';
    if (!APP_CONFIG.validImageTypes.includes(file.type)) {
      return 'Invalid format. Please upload PNG, JPEG, JPG, or WEBP images only.';
    }
    if (file.size > APP_CONFIG.maxFileSize) {
      return `File too large. Maximum size is ${formatFileSize(APP_CONFIG.maxFileSize)}.`;
    }
    return null;
  }

  function showValidation(msg, isError = true) {
    if (!validationMsg) return;
    validationMsg.textContent = msg;
    validationMsg.className = `validation-msg ${isError ? 'error' : 'success'}`;
    validationMsg.hidden = !msg;
  }

  function handleFile(file) {
    const error = validateFile(file);
    if (error) {
      showValidation(error);
      showToast(error, 'error');
      return;
    }
    showValidation('');
    currentFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);

    previewContainer.innerHTML = `<img src="${previewUrl}" alt="Preview of ${escapeHtml(file.name)}" class="preview-image">`;
    fileInfo.innerHTML = `
      <div class="file-meta">
        <span class="file-meta-name">${escapeHtml(file.name)}</span>
        <span class="file-meta-size">${formatFileSize(file.size)} · ${file.type.split('/')[1].toUpperCase()}</span>
      </div>`;

    uploadSection.hidden = true;
    previewSection.hidden = false;
    resultsSection.hidden = true;
  }

  function resetUpload() {
    currentFile = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    fileInput.value = '';
    previewContainer.innerHTML = '';
    uploadSection.hidden = false;
    previewSection.hidden = true;
    resultsSection.hidden = true;
    showValidation('');
  }

  async function runAnalysis() {
    if (!currentFile) return;

    const modelSelect = document.getElementById('modelSelect');
    const model = modelSelect?.value || 'logistic';

    resultsSection.hidden = false;
    resultsContent.innerHTML = buildAnalysisProgress();
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const stepEls = resultsContent.querySelectorAll('.analysis-step');
    const minStepTime = 400;

    for (let i = 0; i < APP_CONFIG.analysisSteps.length; i++) {
      stepEls[i]?.classList.add('active');
      await new Promise((r) => setTimeout(r, minStepTime));
      stepEls[i]?.classList.remove('active');
      stepEls[i]?.classList.add('done');
    }

    try {
      const result = await analyzeImage(currentFile, model);
      const thumb = await createThumbnail(previewUrl);
      addHistoryItem({
        thumbnail: thumb,
        prediction: result.prediction,
        isAI: result.isAI,
        confidence: result.confidence,
        model: result.modelName,
        duration: result.duration,
        fileName: currentFile.name
      });
      displayResults(result);
    } catch (err) {
      displayError(err.message);
    }
  }

  function createThumbnail(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 120;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  }

  window.analyzeAnother = resetUpload;
}

function buildAnalysisProgress() {
  const steps = APP_CONFIG.analysisSteps
    .map((text, i) => `<li class="analysis-step" data-step="${i}"><span class="step-icon"></span><span>${text}</span></li>`)
    .join('');
  return `<div class="analysis-progress glass-card"><ul class="analysis-steps" aria-label="Analysis progress">${steps}</ul></div>`;
}

function displayResults(result) {
  const el = document.getElementById('resultsContent');
  if (!el) return;

  const isAI = result.isAI;
  const cardClass = isAI ? 'result-ai' : 'result-real';
  const label = isAI ? 'AI GENERATED' : 'REAL';
  const icon = isAI ? '🤖' : '✓';

  el.innerHTML = `
    <div class="result-card glass-card ${cardClass} reveal revealed">
      <div class="result-badge" aria-label="Prediction: ${label}">${icon}</div>
      <h2 class="result-label">${label}</h2>
      <div class="result-confidence">
        <div class="confidence-bar" role="progressbar" aria-valuenow="${result.confidence}" aria-valuemin="0" aria-valuemax="100">
          <div class="confidence-fill" style="width:${result.confidence}%"></div>
        </div>
        <span class="confidence-value">${result.confidence}% confidence</span>
      </div>
      <div class="result-meta">
        <div class="meta-item"><span class="meta-label">Model</span><span>${escapeHtml(result.modelName)}</span></div>
        <div class="meta-item"><span class="meta-label">Duration</span><span>${result.duration}ms</span></div>
        <div class="meta-item"><span class="meta-label">Analyzed</span><span>${new Date(result.timestamp).toLocaleString()}</span></div>
      </div>
      <p class="result-details">${escapeHtml(result.details)}</p>
      <div class="result-actions">
        <button class="btn btn-primary btn-ripple" onclick="analyzeAnother()">Analyze Another</button>
        <a href="history.html" class="btn btn-ghost">View History</a>
      </div>
    </div>`;
}

function displayError(message) {
  const el = document.getElementById('resultsContent');
  if (!el) return;
  el.innerHTML = `
    <div class="error-card glass-card reveal revealed" role="alert">
      <div class="error-icon" aria-hidden="true">⚠</div>
      <h3>Analysis Failed</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-primary btn-ripple" id="retryBtn">Try Again</button>
    </div>`;
  document.getElementById('retryBtn')?.addEventListener('click', () => {
    document.getElementById('analyzeBtn')?.click();
  });
}
