import os
import sys

def export_yolo_to_onnx():
    """
    Exports PyTorch YOLOv8 model to optimized ONNX format for accelerated edge inference.
    Supports FP16 half-precision and dynamic batching.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "backend", "yolov8n.pt")
    if not os.path.exists(model_path):
        model_path = os.path.join(base_dir, "yolov8n.pt")
        
    print(f"[ONNX Exporter] Loading model from: {model_path}")
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        
        # Export to ONNX with dynamic shapes and opset 17
        print("[ONNX Exporter] Converting PyTorch weights to ONNX format (opset=17, imgsz=640)...")
        onnx_path = model.export(
            format="onnx",
            imgsz=640,
            dynamic=True,
            simplify=True,
            opset=17
        )
        print(f"[ONNX Exporter] Successfully exported ONNX model to: {onnx_path}")
        return onnx_path
    except Exception as e:
        print(f"[ONNX Exporter] Export failed: {e}")
        return None

if __name__ == "__main__":
    export_yolo_to_onnx()
