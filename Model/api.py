"""
Flask API for AI Detection Model
Connects your trained logistic regression model to the frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from logistic import AIDetectionModel
import os
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model at startup
print("Loading AI detection model...")
detector = AIDetectionModel()

try:
    detector.load_model('ai_detector_model.pkl')
    print("✓ Model loaded successfully!")
except FileNotFoundError:
    print("⚠ Warning: Model file not found. Please train the model first.")
    print("Run: python logistic.py")
except Exception as e:
    print(f"✗ Error loading model: {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'AI Detection API',
        'version': '1.0',
        'status': 'running',
        'model_loaded': detector.is_trained
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_ready': detector.is_trained
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Analyze an uploaded image to detect if it's AI-generated.
    
    Expected request: multipart/form-data with 'file' field
    
    Returns: JSON with prediction results
    """
    
    # Check if model is loaded
    if not detector.is_trained:
        return jsonify({
            'error': 'Model not loaded. Please train the model first.',
            'details': 'Run: python logistic.py'
        }), 503
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({
            'error': 'No file uploaded',
            'details': 'Please upload an image file'
        }), 400
    
    file = request.files['file']
    
    # Check if file has a name
    if file.filename == '':
        return jsonify({
            'error': 'No file selected',
            'details': 'Please select a file to upload'
        }), 400
    
    # Check file type
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file type',
            'details': f'Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    try:
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(filepath)
        
        # Make prediction
        result = detector.predict(filepath)
        
        # Clean up uploaded file
        os.remove(filepath)
        
        if result is None:
            return jsonify({
                'error': 'Failed to analyze image',
                'details': 'Could not extract features from the image'
            }), 500
        
        # Return results
        return jsonify({
            'success': True,
            'is_ai_generated': result['is_ai'],
            'confidence': result['confidence'],
            'prediction': result['prediction'],
            'probabilities': result['probabilities'],
            'details': f"This image appears to be {result['prediction'].lower()} with {result['confidence']:.1f}% confidence."
        })
    
    except Exception as e:
        # Clean up file if it exists
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        
        return jsonify({
            'error': 'Analysis failed',
            'details': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Analyze multiple images at once.
    Expected: multiple files in 'files' field
    """
    
    if not detector.is_trained:
        return jsonify({
            'error': 'Model not loaded'
        }), 503
    
    if 'files' not in request.files:
        return jsonify({
            'error': 'No files uploaded'
        }), 400
    
    files = request.files.getlist('files')
    results = []
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                
                result = detector.predict(filepath)
                os.remove(filepath)
                
                if result:
                    results.append({
                        'filename': filename,
                        'is_ai': result['is_ai'],
                        'confidence': result['confidence'],
                        'prediction': result['prediction']
                    })
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'error': str(e)
                })
    
    return jsonify({
        'success': True,
        'results': results,
        'total': len(results)
    })

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'error': 'File too large',
        'details': f'Maximum file size is {MAX_FILE_SIZE / (1024*1024):.0f}MB'
    }), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'details': 'Something went wrong on the server'
    }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("AI DETECTION API SERVER")
    print("="*60)
    print(f"Model Status: {'✓ Ready' if detector.is_trained else '✗ Not Loaded'}")
    print(f"Upload Folder: {UPLOAD_FOLDER}")
    print(f"Max File Size: {MAX_FILE_SIZE / (1024*1024):.0f}MB")
    print(f"Allowed Extensions: {', '.join(ALLOWED_EXTENSIONS)}")
    print("="*60)
    print("\nStarting server on http://localhost:5000")
    print("\nAPI Endpoints:")
    print("  GET  /          - API info")
    print("  GET  /health    - Health check")
    print("  POST /predict   - Analyze single image")
    print("  POST /batch-predict - Analyze multiple images")
    print("\nPress Ctrl+C to stop")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
