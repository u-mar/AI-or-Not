# 🚀 Quick Start Guide - AI Detection Model

## Step 1: Install Dependencies

```bash
cd Model
pip install -r requirements.txt
```

## Step 2: Prepare Your Dataset

You need to collect images for training:

### Option A: Download Datasets

**Real Images:**
- [ImageNet](http://www.image-net.org/) - Large dataset of real photos
- [COCO Dataset](https://cocodataset.org/) - Common objects in context
- [Flickr](https://www.flickr.com/) - User photos (check licenses)

**AI-Generated Images:**
- Generate with [Stable Diffusion](https://stablediffusionweb.com/)
- [ThisPersonDoesNotExist](https://thispersondoesnotexist.com/) - AI faces
- [DALL-E 2](https://openai.com/dall-e-2/) - Generate various images
- [Midjourney](https://www.midjourney.com/) - AI art generation

### Option B: Create Your Own Dataset

**Real Images:**
```bash
# Take your own photos or download from free stock sites
# Save them to: Model/data/real_images/
```

**AI-Generated Images:**
```bash
# Use any AI image generator (Stable Diffusion, DALL-E, etc.)
# Generate various types: portraits, landscapes, objects, etc.
# Save them to: Model/data/ai_images/
```

### Directory Structure

```
Model/
├── data/
│   ├── real_images/         # 500+ real photos
│   │   ├── photo1.jpg
│   │   ├── photo2.png
│   │   └── ...
│   └── ai_images/           # 500+ AI-generated images
│       ├── ai1.jpg
│       ├── ai2.png
│       └── ...
```

## Step 3: Train Your Model

```bash
# Simple way (with setup checks)
python train.py

# Or directly
python logistic.py
```

**What happens:**
1. Checks if you have enough images
2. Extracts features from all images (color, edges, texture, etc.)
3. Splits data into training (80%) and testing (20%)
4. Trains logistic regression model
5. Evaluates accuracy on test set
6. Saves model as `ai_detector_model.pkl`

**Expected output:**
```
Processing real images...
Processed 500 real images
Processing AI-generated images...
Processed 500 AI-generated images

Dataset prepared: 1000 images
Train set: 800 images
Test set: 200 images

Training model...
Model training completed!

==================================================
MODEL EVALUATION RESULTS
==================================================

Accuracy: 85.50%

Classification Report:
              precision    recall  f1-score
Real              0.87      0.83      0.85
AI-Generated      0.84      0.88      0.86

Confusion Matrix:
[[83 17]
 [12 88]]
==================================================

Model saved to ai_detector_model.pkl
```

## Step 4: Test Your Model

```python
from logistic import AIDetectionModel

# Load model
detector = AIDetectionModel()
detector.load_model('ai_detector_model.pkl')

# Test on an image
result = detector.predict('test_image.jpg')

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']}%")
print(f"Is AI?: {result['is_ai']}")
```

## Step 5: Start the API Server

```bash
python api.py
```

Server will start on `http://localhost:5000`

### API Endpoints:

**1. Check if API is running:**
```bash
curl http://localhost:5000/
```

**2. Analyze an image:**
```bash
curl -X POST -F "file=@image.jpg" http://localhost:5000/predict
```

**Response:**
```json
{
  "success": true,
  "is_ai_generated": true,
  "confidence": 87.5,
  "prediction": "AI-Generated",
  "probabilities": {
    "real": 12.5,
    "ai": 87.5
  },
  "details": "This image appears to be ai-generated with 87.5% confidence."
}
```

## Step 6: Connect to Your Website

Update `public/script.js` in your main project:

```javascript
async function analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Analysis failed');
    }
    
    const data = await response.json();
    
    return {
        isAI: data.is_ai_generated,
        confidence: data.confidence,
        details: data.details
    };
}
```

## Improving Your Model

### 1. Collect More Data
- Aim for 1000+ images per class
- Use diverse sources
- Include various image types (portraits, landscapes, objects)

### 2. Balance Your Dataset
```python
# Check balance
print(f"Real: {real_count}, AI: {ai_count}")
# Should be roughly equal
```

### 3. Try Different Parameters
```python
# In logistic.py, modify:
self.model = LogisticRegression(
    max_iter=2000,      # More iterations
    C=0.1,              # Regularization strength
    solver='saga'       # Different solver
)
```

### 4. Add More Features
Edit `extract_features()` function to add:
- SIFT/SURF keypoints
- Frequency domain analysis (FFT)
- JPEG compression artifacts
- Noise patterns

## Troubleshooting

### Low Accuracy (<70%)
- ✓ Add more training data
- ✓ Balance dataset (equal real and AI images)
- ✓ Check image quality
- ✓ Try different model parameters

### Model Predicts Everything as One Class
- ✓ Dataset severely imbalanced
- ✓ Check if images are loading correctly
- ✓ Verify labels are correct

### "Model not found" Error
- ✓ Train the model first: `python train.py`
- ✓ Check if `ai_detector_model.pkl` exists

### Out of Memory
- ✓ Reduce image resolution (modify `cv2.resize` in `extract_features`)
- ✓ Process in smaller batches
- ✓ Use less training data initially

### API Connection Issues
- ✓ Make sure API is running: `python api.py`
- ✓ Check CORS settings
- ✓ Update API URL in frontend

## Deployment Options

### Option 1: Vercel + External API
- Deploy frontend to Vercel
- Host API on Heroku/Railway/DigitalOcean
- Update API URL in frontend

### Option 2: All-in-One
- Use Vercel Serverless Functions
- Convert model to lightweight format
- Deploy everything together

### Option 3: Cloud ML Service
- Upload model to AWS SageMaker / Google AI Platform
- Use their prediction endpoints
- Scale automatically

## Next Steps

✅ Collect and organize dataset  
✅ Train your model  
✅ Test accuracy  
✅ Start API server  
✅ Connect to frontend  
✅ Deploy to production  

## Need Help?

- Check `Model/README.md` for detailed documentation
- Review code comments in `logistic.py`
- Test with `train.py` first
- Start with small dataset to verify setup

Good luck! 🚀
