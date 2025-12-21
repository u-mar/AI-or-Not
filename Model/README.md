# AI Detection Model

This directory contains the logistic regression model for detecting AI-generated images.

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Prepare your dataset:**

Create two directories with your images:
```
Model/
├── data/
│   ├── real_images/       # Put real photos here
│   └── ai_images/         # Put AI-generated images here
```

## Dataset Preparation

You need to collect images for training:

### Real Images
- Download from datasets like ImageNet, COCO, or Flickr
- Use your own photos
- Ensure they are NOT AI-generated

### AI-Generated Images
- Generate images using Stable Diffusion, DALL-E, Midjourney, etc.
- Download from AI art platforms
- Use various AI generation tools

**Recommended:** At least 500-1000 images of each type for good accuracy.

## Training the Model

1. **Organize your dataset:**
```bash
mkdir -p data/real_images data/ai_images
# Add your images to these directories
```

2. **Train the model:**
```bash
python logistic.py
```

This will:
- Extract features from all images
- Split data into train/test sets (80/20)
- Train the logistic regression model
- Evaluate performance
- Save the trained model as `ai_detector_model.pkl`

## Using the Trained Model

```python
from logistic import AIDetectionModel

# Load trained model
detector = AIDetectionModel()
detector.load_model('ai_detector_model.pkl')

# Predict on new image
result = detector.predict('path/to/image.jpg')

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']}%")
print(f"Is AI?: {result['is_ai']}")
```

## Features Extracted

The model extracts multiple features from each image:

1. **Color Histograms** (RGB and HSV) - 192 features
2. **Edge Detection** - Canny edge density
3. **Texture Features** - Sobel gradients (mean & std)
4. **Statistical Features** - Mean, std, variance
5. **Color Moments** - Per channel statistics

Total: ~205 features per image

## Model Performance

After training, you'll see:
- **Accuracy**: Overall correct predictions
- **Precision**: How many AI predictions were correct
- **Recall**: How many AI images were detected
- **F1-Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: True/False positives/negatives

## Integration with Website

To use this model in your website:

1. **Create an API endpoint** (Flask/FastAPI example coming soon)
2. **Load the model** once at startup
3. **Accept image uploads** from the frontend
4. **Return predictions** as JSON

Example API integration in `api.py`:

```python
from flask import Flask, request, jsonify
from logistic import AIDetectionModel

app = Flask(__name__)
detector = AIDetectionModel()
detector.load_model('ai_detector_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    filepath = f'temp/{file.filename}'
    file.save(filepath)
    
    result = detector.predict(filepath)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
```

## Improving Model Performance

To improve accuracy:

1. **Collect more data** (1000+ images per class)
2. **Balance your dataset** (equal real and AI images)
3. **Use diverse sources** (different AI generators, different photo types)
4. **Try different models** (Random Forest, SVM, Neural Networks)
5. **Tune hyperparameters** (max_iter, C parameter, solver type)

## Current Limitations

- Works best with images (not videos yet)
- Requires sufficient training data
- May struggle with very high-quality AI generations
- Feature-based approach (not deep learning)

## Next Steps

- [ ] Train on your dataset
- [ ] Test model accuracy
- [ ] Create Flask/FastAPI backend
- [ ] Integrate with frontend
- [ ] Deploy model

## Troubleshooting

**Issue:** Low accuracy (<70%)
- **Solution:** Need more training data or better feature engineering

**Issue:** Model predicts everything as AI or Real
- **Solution:** Check dataset balance, ensure you have equal amounts of both

**Issue:** Out of memory errors
- **Solution:** Process images in smaller batches, reduce image resolution

**Issue:** Can't read images
- **Solution:** Check image formats, ensure files aren't corrupted
