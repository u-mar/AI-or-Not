# Deployment Notes

## Model Files

The trained model files (`.pkl`) are **NOT** included in the git repository because they are too large. 

### For Local Development:
1. Train the model: `cd Model && python train.py`
2. Copy to API folder: `cp Model/ai_detector_model.pkl api/`
3. Run local server: `python3 local_server.py`

### For Vercel Deployment:
Since Vercel has file size limits, you have two options:

#### Option 1: Upload Model via Vercel CLI
```bash
# After training your model locally
cp Model/ai_detector_model.pkl api/
vercel --prod
```

#### Option 2: Use External Storage (Recommended for Production)
For large models, consider storing them in:
- **AWS S3** - Download model on serverless function cold start
- **Google Cloud Storage** - Fast access from serverless functions
- **Vercel Blob Storage** - Native Vercel storage solution

Example for downloading from external storage:
```python
import requests
import os

MODEL_URL = "https://your-storage.com/ai_detector_model.pkl"
MODEL_PATH = "/tmp/ai_detector_model.pkl"

if not os.path.exists(MODEL_PATH):
    response = requests.get(MODEL_URL)
    with open(MODEL_PATH, 'wb') as f:
        f.write(response.content)
```

## Dataset Files

The training datasets in `Model/train/` and `Model/test/` are also excluded from git.

- Training data: ~100,000 images
- Test data: ~20,000 images
- Total size: Several GB

**Team members should source their own training data or request access to the shared dataset.**

## What IS Included in Git:

✅ All source code (`.py`, `.js`, `.html`, `.css`)  
✅ Documentation files  
✅ Configuration files (vercel.json, requirements.txt)  
✅ Small example images (if any)  

❌ Model files (*.pkl, *.h5, etc.)  
❌ Dataset folders (train/, test/, data/)  
❌ Virtual environments (venv/)  
❌ Cache files (__pycache__, *.pyc)  
