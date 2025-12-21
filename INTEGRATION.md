# Integration Guide - Connect Model to Frontend

## Option 1: Using Vercel Serverless Function (Recommended)

### Step 1: Train Your Model
```bash
cd Model
pip install -r requirements.txt
python train.py
```

This creates `ai_detector_model.pkl`

### Step 2: Copy Model to API Directory
```bash
cp Model/ai_detector_model.pkl api/
```

### Step 3: Update Frontend (public/script.js)

Replace the `analyzeFile` function (around line 263):

```javascript
async function analyzeFile(file) {
    // Convert file to base64
    const reader = new FileReader();
    const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });

    // Call your Vercel API endpoint
    const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Image
        })
    });

    if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
    }

    const data = await response.json();
    
    return {
        isAI: data.isAI,
        confidence: data.confidence,
        details: data.details
    };
}
```

### Step 4: Deploy to Vercel
```bash
vercel --prod
```

Vercel will automatically detect the `/api/predict.py` function!

---

## Option 2: Using Python Script Locally

### Step 1: Train Model
```bash
cd Model
python train.py
```

### Step 2: Test Predictions
```bash
python predict.py path/to/image.jpg
```

### Step 3: Use in Your Own Backend

If you're building your own backend (Node.js, Python, etc.):

```python
# Your backend code
from Model.logistic import AIDetectionModel

detector = AIDetectionModel()
detector.load_model('Model/ai_detector_model.pkl')

# In your API route
result = detector.predict(uploaded_image_path)
return {
    'isAI': result['is_ai'],
    'confidence': result['confidence'],
    'details': f"Prediction: {result['prediction']}"
}
```

---

## Option 3: Export Model for Other Platforms

### Convert to ONNX (for JavaScript/Web)
```python
# Install skl2onnx
pip install skl2onnx

# In Python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [('float_input', FloatTensorType([None, 205]))]
onx = convert_sklearn(detector.model, initial_types=initial_type)

with open("model.onnx", "wb") as f:
    f.write(onx.SerializeToString())
```

---

## Quick Test Without Deployment

### Test Locally with Python HTTP Server

1. **Train model:**
```bash
cd Model
python train.py
```

2. **Start simple prediction server:**
```bash
python -m http.server 8001
```

3. **Update frontend to use local predictions:**

For development, you can create a simple test endpoint:

```javascript
// In public/script.js
async function analyzeFile(file) {
    // For development: use local model
    const formData = new FormData();
    formData.append('file', file);
    
    // This would call your local Python script
    // You'd need to set up a simple Flask/FastAPI server
    const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    return data;
}
```

---

## Recommended Workflow

1. **Develop Locally:**
   - Train model on your machine
   - Test with `predict.py`
   - Verify accuracy is good (>75%)

2. **Deploy:**
   - Copy model file to `/api` directory
   - Update frontend code
   - Deploy to Vercel
   - API endpoint: `https://your-site.vercel.app/api/predict`

3. **Monitor:**
   - Check predictions are working
   - Collect feedback
   - Retrain with more data if needed

---

## File Structure for Deployment

```
AI-or-Not/
├── public/
│   ├── index.html
│   ├── detector.html
│   ├── script.js          # Updated with API call
│   └── styles.css
├── api/
│   ├── predict.py         # Vercel serverless function
│   └── ai_detector_model.pkl  # Your trained model
├── Model/
│   ├── logistic.py        # Training code
│   ├── train.py           # Training script
│   ├── predict.py         # Local testing
│   └── data/              # Your training data (not deployed)
└── vercel.json
```

---

## Important Notes

1. **Model File Size:**
   - Logistic regression model is small (~few MB)
   - Vercel has 50MB limit for serverless functions
   - Should work fine!

2. **Dependencies for Vercel:**
   Create `api/requirements.txt`:
   ```
   scikit-learn
   numpy
   opencv-python-headless
   Pillow
   ```

3. **Cold Start:**
   - First request might be slow (model loading)
   - Subsequent requests will be fast
   - Vercel caches the model

---

## Testing Your Integration

1. **Test locally:**
```bash
python Model/predict.py test_image.jpg
```

2. **Test API:**
```bash
# After deployment
curl -X POST https://your-site.vercel.app/api/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image_here"}'
```

3. **Test frontend:**
   - Open your deployed site
   - Upload an image
   - Check browser console for any errors
   - Verify results display correctly

---

## Need Help?

- Train model first: `cd Model && python train.py`
- Test locally: `python Model/predict.py image.jpg`
- Check model exists: `ls -la Model/ai_detector_model.pkl`
- Review Vercel logs: `vercel logs`
