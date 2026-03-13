"""
Train a food classification model using the Adaptify Indian food dataset.
Uses MobileNetV2 transfer learning with TensorFlow/Keras.
Exports the trained model to TensorFlow.js format.

Usage:
  pip install tensorflow tensorflowjs Pillow
  python train_food_model.py

The trained model will be saved to ../public/models/food-classifier/
"""

import os
import json
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

# ─── Configuration ───────────────────────────────────────────
DATASET_DIR = os.path.join(os.path.dirname(__file__), 'data')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'food-classifier')
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 0.001
FINE_TUNE_LEARNING_RATE = 0.0001
FINE_TUNE_EPOCHS = 15

# ─── Data Generators ─────────────────────────────────────────
print("🍛 Setting up data generators...")

train_datagen = ImageDataGenerator(
    rescale=1.0/255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.15,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1.0/255)
test_datagen = ImageDataGenerator(rescale=1.0/255)

train_generator = train_datagen.flow_from_directory(
    os.path.join(DATASET_DIR, 'train'),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    os.path.join(DATASET_DIR, 'val'),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

test_generator = test_datagen.flow_from_directory(
    os.path.join(DATASET_DIR, 'test'),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

NUM_CLASSES = len(train_generator.class_indices)
print(f"📊 Found {NUM_CLASSES} classes: {list(train_generator.class_indices.keys())}")

# ─── Build Model ─────────────────────────────────────────────
print("🏗️  Building MobileNetV2 model...")

base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(*IMAGE_SIZE, 3)
)

# Freeze base model layers
base_model.trainable = False

# Add custom classification head
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.3)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.2)(x)
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ─── Callbacks ───────────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)

callbacks = [
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, 'best_model.keras'),
        monitor='val_accuracy',
        save_best_only=True
    )
]

# ─── Phase 1: Train Classification Head ──────────────────────
print("\n🚀 Phase 1: Training classification head...")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=callbacks
)

# ─── Phase 2: Fine-tune Top Layers ──────────────────────────
print("\n🔧 Phase 2: Fine-tuning top layers...")

# Unfreeze the last 30 layers of MobileNetV2
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=FINE_TUNE_LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=FINE_TUNE_EPOCHS,
    callbacks=callbacks
)

# ─── Evaluate ────────────────────────────────────────────────
print("\n📊 Evaluating on test set...")
test_loss, test_accuracy = model.evaluate(test_generator)
print(f"Test Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy:.4f}")

# ─── Export to TensorFlow.js ─────────────────────────────────
print("\n📦 Exporting to TensorFlow.js format...")

try:
    import tensorflowjs as tfjs
    tfjs.converters.save_keras_model(model, OUTPUT_DIR)
    print(f"✅ Model exported to {OUTPUT_DIR}")
except ImportError:
    # Save as SavedModel and convert manually
    saved_model_dir = os.path.join(OUTPUT_DIR, 'saved_model')
    model.save(saved_model_dir)
    print(f"⚠️  tensorflowjs not installed. Model saved to {saved_model_dir}")
    print(f"   To convert, run: tensorflowjs_converter --input_format=tf_saved_model {saved_model_dir} {OUTPUT_DIR}")

# ─── Save class labels mapping ───────────────────────────────
class_indices = train_generator.class_indices
labels = {v: k for k, v in class_indices.items()}

with open(os.path.join(OUTPUT_DIR, 'labels.json'), 'w') as f:
    json.dump({
        'labels': labels,
        'class_indices': class_indices,
        'num_classes': NUM_CLASSES,
        'image_size': IMAGE_SIZE[0],
        'test_accuracy': float(test_accuracy),
    }, f, indent=2)

print(f"\n🎉 Training complete! Labels saved to {os.path.join(OUTPUT_DIR, 'labels.json')}")
print(f"   Test accuracy: {test_accuracy*100:.1f}%")
