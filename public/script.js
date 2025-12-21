// ===== NAVBAR FUNCTIONALITY =====
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelector('.nav-links');
const hamburger = document.querySelector('.hamburger');
const navLinkItems = document.querySelectorAll('.nav-link');

// Hamburger menu toggle
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// Close menu when clicking nav links
navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks) navLinks.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
});

// ===== COUNTER ANIMATION (LANDING PAGE) =====
function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += step;
        if (current < target) {
            element.textContent = current.toFixed(1);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

// Trigger counters on page load (landing page only)
if (document.querySelector('.counter')) {
    const counters = document.querySelectorAll('.counter');
    const observerOptions = {
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => counterObserver.observe(counter));
}

// ===== PARTICLES ANIMATION (LANDING PAGE) =====
if (document.getElementById('particles')) {
    const particles = document.getElementById('particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255, 255, 255, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 10}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        particles.appendChild(particle);
    }
}

// ===== FILE UPLOAD FUNCTIONALITY (DETECTOR PAGE) =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const previewContainer = document.getElementById('previewContainer');
const changeFileBtn = document.getElementById('changeFileBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const fileInfo = document.getElementById('fileInfo');

let currentFile = null;

if (browseBtn) {
    // Browse button click
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

if (uploadArea) {
    // Upload area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });
}

if (fileInput) {
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });
}

// Handle file selection
function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/webm'];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];

    if (!allValidTypes.includes(file.type)) {
        alert('Please select a valid image or video file (JPEG, PNG, GIF, WebP, MP4, AVI, MOV, WebM)');
        return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
        alert('File size must be less than 50MB');
        return;
    }

    currentFile = file;
    displayPreview(file);
    
    // Hide upload area and show preview
    if (uploadSection) uploadSection.style.display = 'none';
    if (previewSection) previewSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
}

// Display file preview
function displayPreview(file) {
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';

    const fileType = file.type.split('/')[0];

    if (fileType === 'image') {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Preview';
        previewContainer.appendChild(img);
    } else if (fileType === 'video') {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        previewContainer.appendChild(video);
    }
    
    // Display file info
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-file" style="color: var(--primary); font-size: 1.5rem;"></i>
                <div>
                    <div style="font-weight: 600; color: var(--dark);">${file.name}</div>
                    <div style="font-size: 0.875rem; color: var(--gray);">${formatFileSize(file.size)} • ${file.type}</div>
                </div>
            </div>
        `;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Change file button
if (changeFileBtn) {
    changeFileBtn.addEventListener('click', () => {
        if (uploadSection) uploadSection.style.display = 'block';
        if (previewSection) previewSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        currentFile = null;
        fileInput.value = '';
        previewContainer.innerHTML = '';
    });
}

// Analyze button
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // Show loading state
        if (resultsSection) resultsSection.style.display = 'block';
        if (resultsContent) {
            resultsContent.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p style="color: var(--gray); margin-top: 1rem;">Analyzing your media... This may take a few moments.</p>
                </div>
            `;
        }

        // Scroll to results
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        try {
            // TODO: Replace this with your actual API call
            const result = await analyzeFile(currentFile);
            displayResults(result);
        } catch (error) {
            displayError(error.message);
        }
    });
}

// Simulate API call (Replace this with your actual API integration)
async function analyzeFile(file) {
    try {
        // Get selected model
        const modelSelect = document.getElementById('modelSelect');
        const selectedModel = modelSelect ? modelSelect.value : 'logistic';
        
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:image/xxx;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        
        const base64Image = await base64Promise;

        // Call the Vercel serverless API
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
                model: selectedModel
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }));
            throw new Error(errorData.error || 'Analysis failed. Please try again.');
        }

        const result = await response.json();
        
        // Transform API response to match expected format
        const isAI = result.prediction === 'AI-Generated';
        const confidence = result.confidence;
        
        return {
            isAI: isAI,
            confidence: confidence,
            model: selectedModel,
            details: isAI 
                ? 'Our analysis detected patterns consistent with AI-generated content. This includes artifacts typical of generative models, unnatural textures, and inconsistent lighting patterns.'
                : 'Our analysis suggests this content is likely authentic. The image exhibits natural characteristics, consistent metadata, and organic imperfections typical of real-world capture.'
        };
        
    } catch (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze the image. Please try again.');
    }
}

// Display analysis results
function displayResults(result) {
    if (!resultsContent) return;
    
    const isAI = result.isAI;
    const confidence = result.confidence;
    const details = result.details;
    const modelName = result.model === 'logistic' ? 'Logistic Regression' : result.model || 'Unknown';

    const resultHTML = `
        <div style="display: flex; align-items: start; gap: 2rem; margin-bottom: 2rem;">
            <div style="flex-shrink: 0;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: ${isAI ? 'linear-gradient(135deg, #ef4444, #fca5a5)' : 'linear-gradient(135deg, #10b981, #6ee7b7)'}; display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${isAI ? 'fa-robot' : 'fa-camera'}" style="font-size: 2.5rem; color: white;"></i>
                </div>
            </div>
            <div style="flex: 1;">
                <h3 style="font-size: 1.75rem; margin-bottom: 0.75rem; color: var(--dark);">
                    ${isAI ? 'AI-Generated Content Detected' : 'Authentic Content Detected'}
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                    <p style="color: var(--gray); margin: 0;">
                        <strong>Confidence:</strong> ${confidence}%
                    </p>
                    <p style="color: var(--gray); margin: 0;">
                        <strong>Model:</strong> ${modelName}
                    </p>
                </div>
                <div style="width: 100%; height: 12px; background: var(--gray-lighter); border-radius: 999px; overflow: hidden; margin-bottom: 1.5rem;">
                    <div style="height: 100%; width: ${confidence}%; background: ${isAI ? 'linear-gradient(90deg, #ef4444, #fca5a5)' : 'linear-gradient(90deg, #10b981, #6ee7b7)'}; transition: width 1s ease;"></div>
                </div>
                <p style="color: var(--gray); line-height: 1.7;">
                    ${details}
                </p>
            </div>
        </div>
        
        <div style="background: var(--light); padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                What does this mean?
            </h4>
            <p style="color: var(--gray); line-height: 1.7;">
                ${isAI 
                    ? 'This media appears to have been created or heavily modified using artificial intelligence. While our model is highly accurate, we recommend considering the context and source when making important decisions based on this analysis.'
                    : 'This media appears to be authentic and captured using traditional methods. Our analysis found natural patterns and characteristics consistent with real-world content. However, always verify important content through multiple sources.'
                }
            </p>
        </div>
        
        <button class="btn-analyze" onclick="analyzeAnother()" style="margin-top: 1rem;">
            <i class="fas fa-redo"></i>
            <span>Analyze Another File</span>
        </button>
    `;

    resultsContent.innerHTML = resultHTML;
}

// Display error
function displayError(message) {
    if (!resultsContent) return;
    
    resultsContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1.5rem; padding: 2rem; background: #fee2e2; border-left: 4px solid var(--danger); border-radius: var(--radius-lg);">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger);"></i>
            <div>
                <h4 style="margin-bottom: 0.5rem; color: var(--dark);">Analysis Failed</h4>
                <p style="color: var(--gray);">${message}</p>
                <button class="btn-change" onclick="analyzeBtn.click()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        </div>
    `;
}

// Analyze another file
function analyzeAnother() {
    if (uploadSection) uploadSection.style.display = 'block';
    if (previewSection) previewSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    currentFile = null;
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.innerHTML = '';
    if (resultsContent) resultsContent.innerHTML = '';
    
    // Scroll to detector section
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Make analyzeAnother globally accessible
window.analyzeAnother = analyzeAnother;

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            firstName: document.getElementById('firstName')?.value || document.getElementById('name')?.value,
            lastName: document.getElementById('lastName')?.value || '',
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value || '',
            subject: document.getElementById('subject')?.value,
            message: document.getElementById('message')?.value
        };

        // TODO: Replace with your actual contact form submission logic
        // Example:
        /*
        try {
            const response = await fetch('YOUR_CONTACT_API_ENDPOINT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            alert('Sorry, there was an error sending your message. Please try again later.');
        }
        */

        // Temporary mock submission
        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.\n\n(Note: This is a demo. Connect your backend to actually send messages.)');
        contactForm.reset();
    });
}

// ===== SMOOTH SCROLL FOR ALL ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Don't prevent default for links that just use # as a placeholder
        if (href === '#' || !href) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== SCROLL REVEAL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements on page load
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.feature-card-modern, .timeline-item, .mission-card, .value-item, .stat-card, .info-card, .faq-item'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ===== CONSOLE MESSAGE =====
console.log('%c🧠 AI or Not - Multi-Page Frontend Ready!', 'color: #6366f1; font-size: 20px; font-weight: bold;');
console.log('%cRemember to connect your AI model API to the analyzeFile() function in script.js', 'color: #8b5cf6; font-size: 14px;');
console.log('%cAPI Integration Points:', 'color: #06b6d4; font-size: 14px; font-weight: bold;');
console.log('1. File Analysis: script.js -> analyzeFile() function (line ~180)');
console.log('2. Contact Form: script.js -> contactForm submit handler (line ~300)');

// ===== AI CHALLENGE GAME =====
const challengeExamples = [
    {
        description: "A photorealistic portrait of a young woman",
        isAI: true,
        hint: "Notice the slight asymmetry in the eyes and unnatural hair texture near the edges."
    },
    {
        description: "A landscape photo of mountains at sunset",
        isAI: false,
        hint: "The natural lighting gradients and atmospheric perspective are consistent with real photography."
    },
    {
        description: "A city street scene with people walking",
        isAI: true,
        hint: "Look at the hands and fingers - AI often struggles with realistic hand anatomy."
    },
    {
        description: "A close-up photo of a flower in a garden",
        isAI: false,
        hint: "The depth of field and natural bokeh are characteristic of real camera optics."
    },
    {
        description: "An interior design shot of a modern living room",
        isAI: true,
        hint: "The reflections on surfaces don't quite match physically accurate behavior."
    },
    {
        description: "A wildlife photo of a bird in flight",
        isAI: false,
        hint: "Motion blur patterns and wing details show real camera capture characteristics."
    },
    {
        description: "A futuristic car in an urban setting",
        isAI: true,
        hint: "Text on signs and license plates appears distorted or nonsensical."
    },
    {
        description: "A food photography shot of a gourmet meal",
        isAI: false,
        hint: "The natural texture variations and authentic lighting setup indicate real photography."
    }
];

let currentChallengeIndex = 0;
let correctGuesses = 0;
let totalGuesses = 0;

function loadChallenge() {
    const challenge = challengeExamples[currentChallengeIndex];
    const imagePlaceholder = document.querySelector('.image-placeholder p');
    
    if (imagePlaceholder) {
        imagePlaceholder.textContent = challenge.description;
    }
    
    // Hide result
    const resultDiv = document.getElementById('challenge-result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

function makeGuess(guess) {
    const challenge = challengeExamples[currentChallengeIndex];
    const isCorrect = (guess === 'ai' && challenge.isAI) || (guess === 'real' && !challenge.isAI);
    
    totalGuesses++;
    if (isCorrect) {
        correctGuesses++;
    }
    
    // Update stats
    updateStats();
    
    // Show result
    showResult(isCorrect, challenge);
}

function showResult(isCorrect, challenge) {
    const resultDiv = document.getElementById('challenge-result');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    
    if (!resultDiv || !resultIcon || !resultTitle || !resultMessage) return;
    
    // Set icon
    if (isCorrect) {
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        resultIcon.className = 'result-icon-large correct';
        resultTitle.textContent = '✨ Correct!';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        resultIcon.className = 'result-icon-large incorrect';
        resultTitle.textContent = '❌ Not Quite!';
    }
    
    // Set message
    const truthText = challenge.isAI ? 'AI-generated' : 'a real photo';
    resultMessage.textContent = `This was ${truthText}. ${challenge.hint}`;
    
    // Show result
    resultDiv.style.display = 'flex';
}

function nextChallenge() {
    currentChallengeIndex = (currentChallengeIndex + 1) % challengeExamples.length;
    loadChallenge();
}

function updateStats() {
    const scoreElement = document.getElementById('challenge-score');
    const totalElement = document.getElementById('challenge-total');
    const accuracyElement = document.getElementById('challenge-accuracy');
    
    if (scoreElement) scoreElement.textContent = correctGuesses;
    if (totalElement) totalElement.textContent = totalGuesses;
    if (accuracyElement) {
        const accuracy = totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0;
        accuracyElement.textContent = accuracy + '%';
    }
}

// Initialize challenge on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.challenge-game')) {
        loadChallenge();
    }
});
