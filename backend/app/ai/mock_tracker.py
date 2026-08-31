from typing import List, Dict
from app.ai.interfaces import TrackerInterface, Detection

class MockTracker(TrackerInterface):
    def __init__(self):
        self.tracks = {}
        self.person_count = 0
        self.vehicle_count = 0

    async def update(self, detections: List[Detection], frame_id: int) -> List[Detection]:
        updated_detections = []
        for det in detections:
            if not det.tracking_id:
                if det.object_type == 'person':
                    self.person_count += 1
                    det.tracking_id = f"P-{self.person_count:03d}"
                else:
                    self.vehicle_count += 1
                    det.tracking_id = f"V-{self.vehicle_count:03d}"
            
            # Update track state
            if det.tracking_id not in self.tracks:
                self.tracks[det.tracking_id] = {
                    'id': det.tracking_id,
                    'type': det.object_type,
                    'first_seen': frame_id,
                    'last_seen': frame_id,
                    'cameras': ['CAM-01'],
                    'path': [],
                    'zone_transitions': [],
                    'direction': 'N',
                    'speed': 5.0
                }
            else:
                self.tracks[det.tracking_id]['last_seen'] = frame_id
                
            updated_detections.append(det)
        return updated_detections

    def get_tracks(self) -> Dict:
        return self.tracks
