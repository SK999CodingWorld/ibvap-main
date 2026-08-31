from typing import List, Dict
import random
from app.ai.interfaces import DetectorInterface, Detection, BoundingBox

class MockDetector(DetectorInterface):
    async def detect(self, frame, config: Dict) -> List[Detection]:
        # Return simulated detections based on scenario
        num_detections = random.randint(1, 5)
        detections = []
        for _ in range(num_detections):
            obj_type = random.choice(['person', 'vehicle'])
            detections.append(Detection(
                object_type=obj_type,
                confidence=random.uniform(0.75, 0.99),
                bbox=BoundingBox(
                    x=random.uniform(0, 1920),
                    y=random.uniform(0, 1080),
                    width=random.uniform(50, 200),
                    height=random.uniform(100, 300)
                ),
                certainty=random.choice(['confirmed', 'probable'])
            ))
        return detections

    def get_model_info(self) -> Dict:
        return {
            'name': 'MockDetector',
            'version': '1.0',
            'type': 'simulation',
            'fps': 28,
            'latency_ms': 35
        }
