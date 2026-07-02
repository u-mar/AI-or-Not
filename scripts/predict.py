#!/usr/bin/env python3
"""CLI predictor — reads base64 image from stdin, prints JSON result."""
import sys
import os
import json
import base64
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'Model'))

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        image_b64 = data.get('image', '')
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]

        from logistic import AIDetectionModel

        model_path = os.path.join(ROOT, 'api', 'ai_detector_model.pkl')
        if not os.path.exists(model_path):
            model_path = os.path.join(ROOT, 'Model', 'ai_detector_model.pkl')

        if not os.path.exists(model_path):
            print(json.dumps({'error': 'Model not found', 'message': 'Train model or set HF_API_TOKEN'}))
            sys.exit(1)

        detector = AIDetectionModel()
        detector.load_model(model_path)

        image_bytes = base64.b64decode(image_b64)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        result = detector.predict(tmp_path)
        os.unlink(tmp_path)

        print(json.dumps({
            'success': True,
            'isAI': result['is_ai'],
            'confidence': result['confidence'],
            'prediction': result['prediction'],
            'details': f"This image appears to be {result['prediction'].lower()} with {result['confidence']:.1f}% confidence."
        }))
    except Exception as e:
        print(json.dumps({'error': 'Analysis failed', 'message': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
