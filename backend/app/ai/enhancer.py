import cv2
import time
import numpy as np
import threading
from typing import Tuple, Dict, Any, Optional

class LowLightEnhancer:
    """
    Adaptive Low-Light & Night-Vision Enhancement Preprocessor
    Analyzes average frame luminance (L-channel in LAB space) and applies
    Contrast Limited Adaptive Histogram Equalization (CLAHE) + Adaptive Gamma Correction
    to prevent object detection and tracking degradation in night/shadow conditions.
    """
    def __init__(self, brightness_threshold: float = 85.0, clip_limit: float = 3.0, enabled: bool = True):
        self.brightness_threshold = brightness_threshold
        self.clip_limit = clip_limit
        self.enabled = enabled
        self.auto_mode = True # Automatically activates when frame brightness drops below threshold
        self.lock = threading.Lock()
        
        self.clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=(8, 8))
        
        # Performance & Telemetry metrics
        self.last_brightness = 128.0
        self.is_currently_enhanced = False
        self.last_latency_ms = 0.0

    def set_config(self, enabled: Optional[bool] = None, threshold: Optional[float] = None, clip_limit: Optional[float] = None) -> Dict[str, Any]:
        with self.lock:
            if enabled is not None:
                self.enabled = enabled
            if threshold is not None:
                self.brightness_threshold = max(10.0, min(240.0, threshold))
            if clip_limit is not None:
                self.clip_limit = clip_limit
                self.clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=(8, 8))
            return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "enabled": self.enabled,
                "auto_mode": self.auto_mode,
                "brightness_threshold": self.brightness_threshold,
                "current_brightness": round(self.last_brightness, 1),
                "is_active": self.is_currently_enhanced,
                "latency_ms": round(self.last_latency_ms, 2),
                "clip_limit": self.clip_limit
            }

    def enhance_frame_if_needed(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Measures frame luminance and conditionally applies CLAHE + Gamma correction.
        Returns enhanced frame and telemetry metadata.
        """
        if not self.enabled:
            with self.lock:
                self.is_currently_enhanced = False
                self.last_latency_ms = 0.0
            return frame, self.get_status()

        t_start = time.perf_counter()
        
        # 1. Convert to LAB color space to extract luminance
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        avg_brightness = float(np.mean(l_channel))
        with self.lock:
            self.last_brightness = avg_brightness

        # 2. Check if frame is below low-light threshold
        if avg_brightness < self.brightness_threshold:
            # Apply CLAHE to L-channel
            enhanced_l = self.clahe.apply(l_channel)
            
            # Adaptive Gamma Shadow Lifting
            # gamma = 0.65 for dark frames (< 50), gamma = 0.80 for moderate low-light
            gamma = 0.60 if avg_brightness < 45 else 0.75
            inv_gamma = 1.0 / gamma
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
            enhanced_l = cv2.LUT(enhanced_l, table)
            
            # Merge enhanced luminance back with chrominance channels
            enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
            enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
            
            t_end = time.perf_counter()
            latency = (t_end - t_start) * 1000.0
            
            with self.lock:
                self.is_currently_enhanced = True
                self.last_latency_ms = latency

            return enhanced_bgr, self.get_status()
        else:
            t_end = time.perf_counter()
            latency = (t_end - t_start) * 1000.0
            with self.lock:
                self.is_currently_enhanced = False
                self.last_latency_ms = latency

            return frame, self.get_status()

low_light_enhancer = LowLightEnhancer()
