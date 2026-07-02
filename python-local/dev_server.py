#!/usr/bin/env python3
"""Minimal Python API server for local Next.js development."""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os
import tempfile
import base64

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'Model'))

try:
    from logistic import AIDetectionModel
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    print('[WARN] Could not import logistic model. Run: pip install -r Model/requirements.txt')

PORT = int(os.environ.get('API_PORT', '5328'))
MODEL_PATH = os.path.join(ROOT, 'python-local', 'ai_detector_model.pkl')
_detector = None


def get_detector():
    global _detector
    if _detector is None and os.path.exists(MODEL_PATH):
        _detector = AIDetectionModel()
        _detector.load_model(MODEL_PATH)
    return _detector


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f'[API] {fmt % args}')

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path != '/api/predict':
            self.send_json({'error': 'Not found'}, 404)
            return

        if not MODEL_AVAILABLE:
            self.send_json({'error': 'Model not available', 'message': 'pip install -r Model/requirements.txt'}, 503)
            return

        detector = get_detector()
        if detector is None:
            self.send_json({'error': 'Model not found', 'message': f'Copy trained model to {MODEL_PATH}'}, 503)
            return

        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length).decode('utf-8'))

            if 'image' not in data:
                raise ValueError('No image data provided')

            image_data = data['image']
            if ',' in image_data:
                image_data = image_data.split(',')[1]

            image_bytes = base64.b64decode(image_data)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(image_bytes)
                tmp_path = tmp.name

            result = detector.predict(tmp_path)
            os.unlink(tmp_path)

            selected_model = data.get('model', 'logistic')
            self.send_json({
                'success': True,
                'isAI': result['is_ai'],
                'confidence': result['confidence'],
                'prediction': result['prediction'],
                'model': selected_model,
                'details': f"This image appears to be {result['prediction'].lower()} with {result['confidence']:.1f}% confidence.",
            })
        except Exception as e:
            self.send_json({'error': 'Analysis failed', 'message': str(e)}, 500)


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    print('=' * 50)
    print(f'[OK] Python API at http://127.0.0.1:{PORT}/api/predict')
    if os.path.exists(MODEL_PATH):
        print(f'[OK] Model: {MODEL_PATH}')
    else:
        print(f'[WARN] Model missing: {MODEL_PATH}')
    print('=' * 50)
    server.serve_forever()
