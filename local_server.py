#!/usr/bin/env python3
"""
Simple local server for testing the AI-or-Not website
Serves static files and handles API requests
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import sys
import os
import tempfile
import base64

# Add Model directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Model'))

try:
    from logistic import AIDetectionModel
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    print("Warning: Could not import logistic model")

class LocalHandler(SimpleHTTPRequestHandler):
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory='public', **kwargs)
    
    def do_GET(self):
        """Serve static files from public directory"""
        if self.path == '/':
            self.path = '/index.html'
        elif self.path == '/manifest.json':
            self.path = '/manifest.json'
        elif self.path == '/service-worker.js':
            self.path = '/service-worker.js'
        return super().do_GET()
    
    def do_POST(self):
        """Handle API requests"""
        if self.path == '/api/predict':
            self.handle_predict()
        else:
            self.send_error(404, "Endpoint not found")
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_predict(self):
        """Handle prediction API endpoint"""
        if not MODEL_AVAILABLE:
            self.send_json_response({
                'error': 'Model not available',
                'message': 'Please install required packages: pip install -r Model/requirements.txt'
            }, status=503)
            return
        
        try:
            # Load model
            model_path = os.path.join(os.path.dirname(__file__), 'api', 'ai_detector_model.pkl')
            if not os.path.exists(model_path):
                self.send_json_response({
                    'error': 'Model not found',
                    'message': f'Please copy the trained model to: {model_path}'
                }, status=503)
                return
            
            detector = AIDetectionModel()
            detector.load_model(model_path)
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get image data
            if 'image' not in data:
                raise ValueError('No image data provided')
            
            image_data = data['image']
            selected_model = data.get('model', 'logistic')
            
            # Remove data URL prefix if present
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
            
            # Clean up
            os.unlink(tmp_path)
            
            # Send response
            response = {
                'success': True,
                'isAI': result['is_ai'],
                'confidence': result['confidence'],
                'prediction': result['prediction'],
                'model': selected_model,
                'details': f"This image appears to be {result['prediction'].lower()} with {result['confidence']:.1f}% confidence."
            }
            
            self.send_json_response(response)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json_response({
                'error': 'Analysis failed',
                'message': str(e)
            }, status=500)
    
    def send_json_response(self, data, status=200):
        """Helper to send JSON responses"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=8000):
    """Start the local development server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, LocalHandler)
    
    print("\n" + "="*60)
    print("AI-or-Not Local Development Server")
    print("="*60)
    print(f"\n[OK] Server running at: http://localhost:{port}")
    print("[OK] Serving files from: ./public/")
    print(f"[OK] API endpoint: http://localhost:{port}/api/predict")
    
    # Check if model exists
    model_path = os.path.join(os.path.dirname(__file__), 'api', 'ai_detector_model.pkl')
    if os.path.exists(model_path):
        print("[OK] Model loaded: api/ai_detector_model.pkl")
    else:
        print("\n[WARN] Model not found at api/ai_detector_model.pkl")
        print("       The detector will not work until you copy the model file.")
    
    print("\n" + "="*60)
    print("Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("Server stopped")
        print("="*60 + "\n")
        httpd.shutdown()

if __name__ == "__main__":
    # Check if custom port provided
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            print("Using default port 8000")
    
    run_server(port)
