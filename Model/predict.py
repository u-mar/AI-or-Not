"""
Simple prediction script for the trained model.
Use this to test your trained model on individual images.
"""

from logistic import AIDetectionModel
import sys
import json

def predict_image(image_path, output_format='json'):
    """
    Predict if an image is AI-generated.
    
    Args:
        image_path: Path to the image file
        output_format: 'json', 'text', or 'dict'
    
    Returns:
        Prediction results in specified format
    """
    # Load model
    detector = AIDetectionModel()
    
    try:
        detector.load_model('ai_detector_model.pkl')
    except FileNotFoundError:
        print("Error: Model file not found!")
        print("Please train the model first by running: python train.py")
        return None
    
    # Make prediction
    result = detector.predict(image_path)
    
    if result is None:
        print(f"Error: Could not analyze image: {image_path}")
        return None
    
    # Format output
    if output_format == 'json':
        return json.dumps(result, indent=2)
    elif output_format == 'text':
        return f"""
Image Analysis Results:
-----------------------
File: {image_path}
Prediction: {result['prediction']}
Confidence: {result['confidence']}%
Is AI-Generated: {result['is_ai']}

Probability Breakdown:
  Real: {result['probabilities']['real']}%
  AI: {result['probabilities']['ai']}%
"""
    else:
        return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        print("Example: python predict.py test_image.jpg")
        return
    
    image_path = sys.argv[1]
    
    print(f"\nAnalyzing: {image_path}\n")
    result = predict_image(image_path, output_format='text')
    
    if result:
        print(result)

if __name__ == "__main__":
    main()
