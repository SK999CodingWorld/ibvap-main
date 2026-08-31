import os
import cv2
import numpy as np
import threading
import time
from typing import Dict, List, Tuple, Optional, Any

class FaceRecognitionEngine:
    """
    High-Performance Face Recognition & Watchlist Security Engine
    Extracts face embeddings from detected person bounding boxes and matches
    against an authorized database and designated blacklist.
    """
    def __init__(self, database_dir: Optional[str] = None, similarity_threshold: float = 0.60):
        self.similarity_threshold = similarity_threshold
        self.known_embeddings: Dict[str, np.ndarray] = {}
        self.blacklist_names: set = set()
        self.database_metadata: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
        
        # Determine database directory
        if database_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            database_dir = os.path.join(base_dir, "known_faces")
        self.database_dir = database_dir
        
        self.face_cascade = None
        try:
            if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                if os.path.exists(cascade_path):
                    self.face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            self.face_cascade = None

        self._init_database()

    def _init_database(self):
        """Creates sample watchlist database if empty and loads embeddings"""
        os.makedirs(self.database_dir, exist_ok=True)
        
        # Create sample high-profile demo watchlist profiles
        sample_profiles = [
            ("Tariq_Malik_BLACKLIST", True, "Red Notice - Suspected Infiltrator"),
            ("Elena_Rostova_BLACKLIST", True, "Blacklisted Smuggling Associate"),
            ("Commander_Vikram_Singh_AUTHORISED", False, "SSB Senior Patrol Commander"),
            ("Officer_Priya_Sharma_AUTHORISED", False, "BOP-01 Gate Security Officer"),
            ("John_Doe_VISITOR", False, "Registered Contractor")
        ]
        
        for name, is_blacklist, notes in sample_profiles:
            filepath = os.path.join(self.database_dir, f"{name}.jpg")
            if not os.path.exists(filepath):
                # Generate sample high-contrast facial portrait matrix
                img = np.zeros((160, 160, 3), dtype=np.uint8)
                color = (40, 40, 180) if is_blacklist else (50, 150, 50)
                cv2.circle(img, (80, 80), 55, color, -1)
                cv2.circle(img, (60, 70), 8, (255, 255, 255), -1) # Left eye
                cv2.circle(img, (100, 70), 8, (255, 255, 255), -1) # Right eye
                cv2.ellipse(img, (80, 105), (25, 12), 0, 0, 180, (255, 255, 255), 3) # Mouth
                cv2.putText(img, name.split('_')[0], (15, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
                cv2.imwrite(filepath, img)

        self.reload_database()

    def reload_database(self):
        """Scans database folder and computes 128D normalized feature embeddings"""
        with self.lock:
            self.known_embeddings.clear()
            self.blacklist_names.clear()
            self.database_metadata.clear()
            
            if not os.path.exists(self.database_dir):
                return
                
            for filename in os.listdir(self.database_dir):
                if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                    
                path = os.path.join(self.database_dir, filename)
                raw_name = os.path.splitext(filename)[0]
                
                # Check blacklist tag in filename
                is_blacklist = "blacklist" in raw_name.lower() or "fugitive" in raw_name.lower() or "terror" in raw_name.lower()
                clean_name = raw_name.replace("_BLACKLIST", "").replace("_AUTHORISED", "").replace("_VISITOR", "").replace("_", " ")
                
                img = cv2.imread(path)
                if img is not None:
                    emb = self._extract_embedding_from_image(img)
                    if emb is not None:
                        self.known_embeddings[clean_name] = emb
                        if is_blacklist:
                            self.blacklist_names.add(clean_name)
                        self.database_metadata[clean_name] = {
                            "name": clean_name,
                            "filename": filename,
                            "is_blacklist": is_blacklist,
                            "status": "BLACKLIST" if is_blacklist else "AUTHORISED"
                        }
                        
            print(f"[Face Engine] Loaded {len(self.known_embeddings)} face embeddings ({len(self.blacklist_names)} blacklisted).")

    def _extract_embedding_from_image(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        Extracts a normalized 128D feature embedding using multi-scale 
        spatial frequency & gradient descriptors.
        """
        if img is None or img.size == 0:
            return None
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        resized = cv2.resize(gray, (96, 96))
        
        # Multi-region Local Directional & Intensity Feature Vector (128D)
        cell_size = 24
        features = []
        for r in range(0, 96, cell_size):
            for c in range(0, 96, cell_size):
                cell = resized[r:r+cell_size, c:c+cell_size]
                gx = cv2.Sobel(cell, cv2.CV_32F, 1, 0, ksize=3)
                gy = cv2.Sobel(cell, cv2.CV_32F, 0, 1, ksize=3)
                mag = cv2.magnitude(gx, gy)
                
                features.extend([
                    float(np.mean(cell) / 255.0),
                    float(np.std(cell) / 255.0),
                    float(np.mean(mag) / 255.0),
                    float(np.std(mag) / 255.0),
                    float(np.max(cell) / 255.0),
                    float(np.min(cell) / 255.0),
                    float(np.median(cell) / 255.0),
                    float(np.percentile(cell, 75) / 255.0)
                ])
                
        emb = np.array(features, dtype=np.float32)
        norm = np.linalg.norm(emb)
        if norm > 1e-6:
            emb = emb / norm
        return emb

    def recognize_person_face(self, frame: np.ndarray, person_box: Tuple[int, int, int, int]) -> Dict[str, Any]:
        """
        Crops face region from a detected person box, computes embedding, 
        and matches against known database.
        """
        x1, y1, x2, y2 = person_box
        h, w = frame.shape[:2]
        
        # Clamp coordinates
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        if x2 - x1 < 20 or y2 - y1 < 20:
            return {"status": "UNKNOWN", "name": "UNKNOWN", "similarity": 0.0, "is_blacklist": False}
            
        # Crop head region (upper 45% of person bounding box)
        head_y2 = y1 + int((y2 - y1) * 0.45)
        head_crop = frame[y1:head_y2, x1:x2]
        
        if head_crop.size == 0:
            return {"status": "UNKNOWN", "name": "UNKNOWN", "similarity": 0.0, "is_blacklist": False}
            
        # Attempt face detection if cascade available, else use head crop
        face_img = head_crop
        if self.face_cascade is not None:
            try:
                gray_head = cv2.cvtColor(head_crop, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray_head, scaleFactor=1.15, minNeighbors=3, minSize=(20, 20))
                if len(faces) > 0:
                    fx, fy, fw, fh = faces[0]
                    face_img = head_crop[fy:fy+fh, fx:fx+fw]
            except Exception:
                face_img = head_crop

        # Generate Embedding
        target_emb = self._extract_embedding_from_image(face_img)
        if target_emb is None:
            return {"status": "UNKNOWN", "name": "UNKNOWN", "similarity": 0.0, "is_blacklist": False}

        # Compare against known faces database using Cosine Similarity
        best_name = None
        best_sim = 0.0
        
        with self.lock:
            for name, known_emb in self.known_embeddings.items():
                sim = float(np.dot(target_emb, known_emb))
                if sim > best_sim:
                    best_sim = sim
                    best_name = name

        # Decision Threshold Logic
        if best_sim >= self.similarity_threshold and best_name:
            is_blacklist = best_name in self.blacklist_names
            return {
                "status": "BLACKLIST_MATCH" if is_blacklist else "RECOGNIZED",
                "name": best_name,
                "similarity": round(best_sim * 100, 1),
                "is_blacklist": is_blacklist
            }
        else:
            return {
                "status": "UNKNOWN",
                "name": "UNKNOWN",
                "similarity": round(best_sim * 100, 1),
                "is_blacklist": False
            }

    def get_watchlist(self) -> List[Dict[str, Any]]:
        with self.lock:
            return list(self.database_metadata.values())

face_engine = FaceRecognitionEngine()
