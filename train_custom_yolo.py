"""
========================================================================================
IBVAP - Multi-Class Security & Weapon Detection Fine-Tuning Pipeline
========================================================================================
This script demonstrates how to:
1. Download an open-source weapon & firearm detection dataset from Roboflow Universe
2. Merge weapon annotations with standard COCO security classes (person, vehicles, bags)
3. Fine-tune YOLOv8 / YOLOv11 for single-pass unified multi-class detection
4. Export the fine-tuned model checkpoint as 'yolov8_security_custom.pt'

Target Classes (Unified in 1 single pass):
  0: person
  1: bicycle
  2: car
  3: motorcycle
  4: bus
  5: truck
  6: backpack
  7: suitcase
  8: knife
  9: gun / pistol
========================================================================================
"""

import os
import yaml
from ultralytics import YOLO

# -------------------------------------------------------------
# 1. Dataset Configuration (data.yaml)
# -------------------------------------------------------------
DATASET_YAML_CONTENT = """
# Unified Security & Weapon Dataset
path: ./datasets/security_weapons # dataset root dir
train: images/train               # train images (relative to 'path')
val: images/val                   # val images (relative to 'path')

# Class Names
names:
  0: person
  1: bicycle
  2: car
  3: motorcycle
  4: bus
  5: truck
  6: backpack
  7: suitcase
  8: knife
  9: gun
"""

def create_dataset_config():
    os.makedirs("./datasets/security_weapons", exist_ok=True)
    yaml_path = "./datasets/security_weapons/data.yaml"
    with open(yaml_path, "w") as f:
        f.write(DATASET_YAML_CONTENT.strip())
    print(f"[Dataset Config] Saved configuration to {yaml_path}")
    return yaml_path

# -------------------------------------------------------------
# 2. Download Open-Source Weapon Dataset from Roboflow
# -------------------------------------------------------------
def download_roboflow_dataset(api_key: str = None):
    """
    Downloads an open-access weapon detection dataset.
    If you have a Roboflow API key, replace YOUR_ROBOFLOW_KEY below.
    Dataset: Roboflow Universe 'Weapons and Pistols Detection'
    """
    try:
        from roboflow import Roboflow
        if not api_key:
            print("[Dataset] No Roboflow API key provided. Skipping automatic download.")
            print("[Dataset] You can get a free key at https://universe.roboflow.com/mohamed-traore-2-fsetup/weapons-yolov8")
            return
            
        rf = Roboflow(api_key=api_key)
        project = rf.workspace("mohamed-traore-2-fsetup").project("weapons-yolov8")
        dataset = project.version(1).download("yolov8", location="./datasets/security_weapons")
        print(f"[Dataset] Downloaded weapons dataset to {dataset.location}")
    except ImportError:
        print("[Dataset] roboflow package not installed. Run: pip install roboflow")

# -------------------------------------------------------------
# 3. Fine-Tune YOLOv8 / YOLOv11 (Single-Pass Multi-Class)
# -------------------------------------------------------------
def train_unified_model(
    base_model: str = "yolov8s.pt",
    data_yaml: str = "./datasets/security_weapons/data.yaml",
    epochs: int = 50,
    batch_size: int = 16,
    img_size: int = 640
):
    """
    Fine-tunes pretrained YOLO on the merged security + weapon dataset.
    """
    print(f"[Training] Initializing transfer learning from {base_model}...")
    model = YOLO(base_model)

    # Train model
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        patience=15,             # Early stopping patience
        save=True,
        device="0" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu",
        workers=4,
        project="runs/security_weapons",
        name="yolov8_security_v1",
        pretrained=True,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        verbose=True
    )

    # Save final deployment weights
    best_weights = "runs/security_weapons/yolov8_security_v1/weights/best.pt"
    export_target = "yolov8_security_custom.pt"
    
    if os.path.exists(best_weights):
        import shutil
        shutil.copy(best_weights, export_target)
        print(f"[Export] Saved production model checkpoint to: {export_target}")
    else:
        print(f"[Training Complete] Check runs directory for trained weights.")

    return model

# -------------------------------------------------------------
# 4. Standalone Multi-Class Inference Test Loop
# -------------------------------------------------------------
def test_inference(model_path: str = "yolov8_security_custom.pt", video_source: str = "test.mp4"):
    import cv2
    
    # If custom model not trained yet, fallback to yolov8n
    if not os.path.exists(model_path):
        print(f"[Inference] {model_path} not found. Running with base yolov8n.pt...")
        model_path = "yolov8n.pt"

    model = YOLO(model_path)
    cap = cv2.VideoCapture(video_source)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Single-pass ByteTrack tracking with all classes
        results = model.track(frame, persist=True, tracker="bytetrack.yaml", conf=0.30, verbose=False)
        annotated_frame = results[0].plot()

        cv2.imshow("IBVAP Multi-Class Security & Weapon Inference", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    yaml_file = create_dataset_config()
    print("\n--- Next Steps to Fine-Tune ---")
    print("1. Download open dataset from: https://universe.roboflow.com/search?q=weapon+detection")
    print("2. Extract images into ./datasets/security_weapons/images/train and val")
    print("3. Run: python train_custom_yolo.py to start training")
    print("4. Resulting 'yolov8_security_custom.pt' will be automatically used by the live stream server!")
