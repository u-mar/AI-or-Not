"""
Quick Start Guide for Training Your AI Detection Model

This script will help you get started with training your model.
"""

import os
import sys

def check_setup():
    """Check if everything is set up correctly."""
    print("\n" + "="*60)
    print("AI DETECTION MODEL - SETUP CHECK")
    print("="*60 + "\n")
    
    # Check for train and test directories (user's existing structure)
    required_dirs = {
        'train': 'Training data directory',
        'train/REAL': 'Real images (training)',
        'train/FAKE': 'Fake/AI images (training)',
        'test': 'Test data directory',
        'test/REAL': 'Real images (testing)',
        'test/FAKE': 'Fake/AI images (testing)'
    }
    
    all_exist = True
    dir_status = {}
    
    for dir_path, description in required_dirs.items():
        exists = os.path.exists(dir_path)
        dir_status[dir_path] = exists
        status = "✓" if exists else "✗"
        print(f"{status} {description}: {dir_path}")
        if not exists:
            all_exist = False
    
    if not all_exist:
        print("\n❌ Setup incomplete!")
        print("\nPlease ensure all directories exist:")
        print("  - train/REAL/    (real photos for training)")
        print("  - train/FAKE/    (AI/fake images for training)")
        print("  - test/REAL/     (real photos for testing)")
        print("  - test/FAKE/     (AI/fake images for testing)")
        print("\n" + "="*60)
        return False
    
    # Count images in each directory
    train_real = [f for f in os.listdir('train/REAL') 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
    train_fake = [f for f in os.listdir('train/FAKE') 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
    test_real = [f for f in os.listdir('test/REAL') 
                 if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
    test_fake = [f for f in os.listdir('test/FAKE') 
                 if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
    
    print(f"\n📊 Dataset Statistics:")
    print(f"\n  Training Set:")
    print(f"    Real images: {len(train_real)}")
    print(f"    Fake/AI images: {len(train_fake)}")
    print(f"    Total: {len(train_real) + len(train_fake)}")
    
    print(f"\n  Test Set:")
    print(f"    Real images: {len(test_real)}")
    print(f"    Fake/AI images: {len(test_fake)}")
    print(f"    Total: {len(test_real) + len(test_fake)}")
    
    print(f"\n  Grand Total: {len(train_real) + len(train_fake) + len(test_real) + len(test_fake)} images")
    
    # Validation checks
    if len(train_real) == 0 or len(train_fake) == 0:
        print("\n⚠️  Error: Training directories are empty!")
        print("Please add images to train/REAL and train/FAKE before training.")
        print("\n" + "="*60)
        return False
    
    if len(test_real) == 0 or len(test_fake) == 0:
        print("\n⚠️  Error: Test directories are empty!")
        print("Please add images to test/REAL and test/FAKE before training.")
        print("\n" + "="*60)
        return False
    
    total_train = len(train_real) + len(train_fake)
    if total_train < 50:
        print("\n⚠️  Warning: Small training dataset!")
        print("For better results, use at least 100+ images per category.")
        print("💡 Tip: More training data = better model accuracy")
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            return False
    
    print("\n✓ Setup check passed!")
    print("="*60 + "\n")
    return True

def main():
    """Main training flow."""
    
    if not check_setup():
        print("\n❌ Setup incomplete. Please add images and try again.\n")
        return
    
    print("Starting training process...")
    print("This may take several minutes depending on dataset size...")
    print("Progress updates will be shown every 100 images processed.\n")
    
    # Import and run the main training script
    try:
        from logistic import main as train_model
        train_model()
        
    except ImportError as e:
        print(f"\n❌ Error importing required modules: {e}")
        print("\nPlease install dependencies first:")
        print("  pip install -r requirements.txt\n")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
    print(f"\n❌ Error during training: {e}\n")

if __name__ == "__main__":
    main()
