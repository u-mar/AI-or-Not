import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import os
from PIL import Image
import cv2

class AIDetectionModel:
    def __init__(self):
        self.model = LogisticRegression(max_iter=1000, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def extract_features(self, image_path):
        """
        Extract features from an image for AI detection.
        Features include: color histograms, edge detection, texture patterns, etc.
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Cannot read image: {image_path}")
            
            # Resize to standard size
            img = cv2.resize(img, (224, 224))
            
            # Convert to different color spaces
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            features = []
            
            # 1. Color Histogram Features (RGB)
            for i in range(3):
                hist = cv2.calcHist([img], [i], None, [32], [0, 256])
                features.extend(hist.flatten())
            
            # 2. HSV Histogram Features
            for i in range(3):
                hist = cv2.calcHist([hsv], [i], None, [32], [0, 256])
                features.extend(hist.flatten())
            
            # 3. Edge Detection Features
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges) / (edges.shape[0] * edges.shape[1])
            features.append(edge_density)
            
            # 4. Texture Features (using Sobel)
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            features.append(np.mean(np.abs(sobelx)))
            features.append(np.std(np.abs(sobelx)))
            features.append(np.mean(np.abs(sobely)))
            features.append(np.std(np.abs(sobely)))
            
            # 5. Statistical Features
            features.append(np.mean(gray))
            features.append(np.std(gray))
            features.append(np.var(gray))
            
            # 6. Color Moments
            for channel in cv2.split(img):
                features.append(np.mean(channel))
                features.append(np.std(channel))
                features.append(np.var(channel))
            
            return np.array(features)
            
        except Exception as e:
            print(f"Error extracting features from {image_path}: {e}")
            return None
    
    def prepare_dataset(self, real_images_dir, ai_images_dir):
        """
        Prepare dataset from directories containing real and AI-generated images.
        
        Args:
            real_images_dir: Path to directory with real images
            ai_images_dir: Path to directory with AI-generated images (FAKE)
        
        Returns:
            X: Feature matrix
            y: Labels (0 = real, 1 = AI/FAKE)
        """
        X = []
        y = []
        
        print(f"Processing real images from: {real_images_dir}")
        real_files = [f for f in os.listdir(real_images_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
        print(f"Found {len(real_files)} real image files")
        
        for idx, filename in enumerate(real_files, 1):
            if idx % 100 == 0:
                print(f"  Processed {idx}/{len(real_files)} real images...")
            filepath = os.path.join(real_images_dir, filename)
            features = self.extract_features(filepath)
            if features is not None:
                X.append(features)
                y.append(0)  # 0 = real
        
        print(f"✓ Successfully processed {len([label for label in y if label == 0])} real images")
        
        print(f"\nProcessing AI/FAKE images from: {ai_images_dir}")
        ai_files = [f for f in os.listdir(ai_images_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
        print(f"Found {len(ai_files)} AI/FAKE image files")
        
        for idx, filename in enumerate(ai_files, 1):
            if idx % 100 == 0:
                print(f"  Processed {idx}/{len(ai_files)} AI/FAKE images...")
            filepath = os.path.join(ai_images_dir, filename)
            features = self.extract_features(filepath)
            if features is not None:
                X.append(features)
                y.append(1)  # 1 = AI/FAKE
        
        print(f"✓ Successfully processed {len([label for label in y if label == 1])} AI/FAKE images")
        
        return np.array(X), np.array(y)
    
    def train(self, X_train, y_train):
        """Train the logistic regression model."""
        print("\nTraining model...")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        print("Model training completed!")
        
    def evaluate(self, X_test, y_test):
        """Evaluate model performance."""
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation!")
        
        X_test_scaled = self.scaler.transform(X_test)
        y_pred = self.model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        
        print("\n" + "="*50)
        print("MODEL EVALUATION RESULTS")
        print("="*50)
        print(f"\nAccuracy: {accuracy * 100:.2f}%")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Real', 'AI-Generated']))
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        print("="*50)
        
        return accuracy
    
    def predict(self, image_path):
        """
        Predict if an image is AI-generated or real.
        
        Returns:
            dict: {
                'is_ai': bool,
                'confidence': float (0-100),
                'prediction': str
            }
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction!")
        
        # Extract features
        features = self.extract_features(image_path)
        if features is None:
            return None
        
        # Scale features
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # Predict
        prediction = self.model.predict(features_scaled)[0]
        probability = self.model.predict_proba(features_scaled)[0]
        
        # Get confidence (probability of predicted class)
        confidence = probability[prediction] * 100
        
        result = {
            'is_ai': bool(prediction == 1),
            'confidence': round(confidence, 2),
            'prediction': 'AI-Generated' if prediction == 1 else 'Real',
            'probabilities': {
                'real': round(probability[0] * 100, 2),
                'ai': round(probability[1] * 100, 2)
            }
        }
        
        return result
    
    def save_model(self, filepath='ai_detector_model.pkl'):
        """Save trained model and scaler."""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving!")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"\nModel saved to {filepath}")
    
    def load_model(self, filepath='ai_detector_model.pkl'):
        """Load trained model and scaler."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.is_trained = True
        
        print(f"Model loaded from {filepath}")


def main():
    """Example usage of the AI Detection Model."""
    
    # Initialize model
    detector = AIDetectionModel()
    
    # Use existing train and test folders
    train_real_dir = 'train/REAL'
    train_fake_dir = 'train/FAKE'
    test_real_dir = 'test/REAL'
    test_fake_dir = 'test/FAKE'
    
    # Check if directories exist
    if not all([os.path.exists(d) for d in [train_real_dir, train_fake_dir, test_real_dir, test_fake_dir]]):
        print(f"ERROR: Required directories not found!")
        print(f"Please ensure the following directories exist:")
        print(f"  - {train_real_dir}")
        print(f"  - {train_fake_dir}")
        print(f"  - {test_real_dir}")
        print(f"  - {test_fake_dir}")
        return
    
    print("\n" + "="*60)
    print("AI DETECTION MODEL - TRAINING")
    print("="*60)
    
    # Prepare training dataset
    print("\n📁 LOADING TRAINING DATA")
    print("="*60)
    X_train, y_train = detector.prepare_dataset(train_real_dir, train_fake_dir)
    
    if len(X_train) == 0:
        print("ERROR: No training images found!")
        return
    
    print(f"\n✓ Training dataset prepared: {len(X_train)} images")
    print(f"  Real images: {np.sum(y_train == 0)}")
    print(f"  FAKE/AI images: {np.sum(y_train == 1)}")
    
    # Prepare test dataset
    print("\n📁 LOADING TEST DATA")
    print("="*60)
    X_test, y_test = detector.prepare_dataset(test_real_dir, test_fake_dir)
    
    if len(X_test) == 0:
        print("ERROR: No test images found!")
        return
    
    print(f"\n✓ Test dataset prepared: {len(X_test)} images")
    print(f"  Real images: {np.sum(y_test == 0)}")
    print(f"  FAKE/AI images: {np.sum(y_test == 1)}")
    
    # Train model
    print("\n🔧 TRAINING MODEL")
    print("="*60)
    detector.train(X_train, y_train)
    
    # Evaluate model
    print("\n📊 EVALUATING MODEL")
    print("="*60)
    accuracy = detector.evaluate(X_test, y_test)
    
    # Save model
    print("\n💾 SAVING MODEL")
    print("="*60)
    detector.save_model('ai_detector_model.pkl')
    
    # Example prediction on test set
    print("\n🔍 EXAMPLE PREDICTIONS")
    print("="*60)
    
    # Test on a real image if available
    real_files = [f for f in os.listdir(test_real_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
    if len(real_files) > 0:
        test_image = os.path.join(test_real_dir, real_files[0])
        result = detector.predict(test_image)
        print(f"\nReal image: {real_files[0]}")
        print(f"  Prediction: {result['prediction']}")
        print(f"  Confidence: {result['confidence']}%")
        print(f"  Probabilities: Real={result['probabilities']['real']}%, AI={result['probabilities']['ai']}%")
    
    # Test on a fake image if available
    fake_files = [f for f in os.listdir(test_fake_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
    if len(fake_files) > 0:
        test_image = os.path.join(test_fake_dir, fake_files[0])
        result = detector.predict(test_image)
        print(f"\nFake/AI image: {fake_files[0]}")
        print(f"  Prediction: {result['prediction']}")
        print(f"  Confidence: {result['confidence']}%")
        print(f"  Probabilities: Real={result['probabilities']['real']}%, AI={result['probabilities']['ai']}%")
    
    print("\n" + "="*60)
    print("✓ TRAINING COMPLETE!")
    print("="*60)
    print(f"\nModel accuracy: {accuracy * 100:.2f}%")
    print(f"Model saved to: ai_detector_model.pkl")
    print("\nNext steps:")
    print("  1. Test with: python predict.py <image_path>")
    print("  2. Deploy: cp ai_detector_model.pkl ../api/")
    print("  3. Push to production: vercel --prod")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
