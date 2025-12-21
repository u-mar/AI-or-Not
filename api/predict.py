"""
Vercel Serverless Function for AI Detection

This function will be deployed as an API endpoint on Vercel.
Place this file in: /api/predict.py
"""

from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add Model directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'Model'))

from logistic import AIDetectionModel
import tempfile
import base64

# Load model once (will be cached by Vercel)
detector = AIDetectionModel()
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ai_detector_model.pkl')

try:
    detector.load_model(MODEL_PATH)
    MODEL_LOADED = True
except Exception as e:
    print(f"Failed to load model: {e}")
    MODEL_LOADED = False

class handler(BaseHTTPRequestHandler):
    
    def do_POST(self):
        """Handle POST requests for image analysis."""
        
        if not MODEL_LOADED:
            self.send_response(503)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Model not loaded',
                'message': 'Please train and upload the model file'
            }).encode())
            return
        
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON body
            data = json.loads(post_data.decode('utf-8'))
            
            # Get model selection (default to logistic)
            selected_model = data.get('model', 'logistic')
            
            # Get image data (base64 encoded)
            if 'image' not in data:
                raise ValueError('No image data provided')
            
            image_data = data['image']
            
            # If it includes the data URL prefix, remove it
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                tmp_file.write(image_bytes)
                tmp_path = tmp_file.name
            
            # Make prediction
            result = detector.predict(tmp_path)
            
            # Clean up temp file
            os.unlink(tmp_path)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'isAI': result['is_ai'],
                'confidence': result['confidence'],
                'prediction': result['prediction'],
                'model': selected_model,
                'details': f"This image appears to be {result['prediction'].lower()} with {result['confidence']:.1f}% confidence."
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Analysis failed',
                'message': str(e)
            }).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
