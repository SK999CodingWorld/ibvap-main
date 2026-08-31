import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.websocket import broadcast_event

class SimulationEngine:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationEngine, cls).__new__(cls)
            cls._instance._init()
        return cls._instance
        
    def _init(self):
        self.running = False
        self.speed = 1.0
        self.current_scenario = "normal"
        self._task = None
        self.cameras = ["BOP-01", "BOP-02", "BOP-03", "CHECK-01", "ROAD-01", "ROAD-02", "GATE-01", "WATCH-01"]
        self.tracking_id_counter = 1
        
    def get_status(self) -> Dict[str, Any]:
        return {
            "running": self.running,
            "speed": self.speed,
            "current_scenario": self.current_scenario
        }
        
    def start(self):
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._simulation_loop())
            
    def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None
            
    def set_speed(self, speed: float):
        self.speed = speed
        
    async def trigger_scenario(self, scenario: str):
        self.current_scenario = scenario
        # We might immediately trigger a specific event based on the scenario
        event = self._generate_scenario_event(scenario)
        if event:
            await broadcast_event(event["event_type"], event)
            
    def _get_next_tracking_id(self, prefix: str) -> str:
        id_str = f"{prefix}-{self.tracking_id_counter:03d}"
        self.tracking_id_counter += 1
        return id_str

    def _generate_anpr(self) -> str:
        states = ["DL", "HR", "UP", "RJ", "PB"]
        return f"{random.choice(states)}-{random.randint(10,99)}-{random.choice(['A','B','C','D'])}{random.choice(['A','B','C','D'])}-{random.randint(1000,9999)}"

    def _generate_scenario_event(self, scenario: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc).isoformat()
        base_event = {"timestamp": timestamp, "simulation": True}
        
        if scenario == "intrusion" or scenario == "night_intrusion":
            cam = "BOP-01" if scenario == "intrusion" else "BOP-03"
            return {
                **base_event,
                "event_type": "alert",
                "data": {
                    "id": str(uuid.uuid4()),
                    "camera_id": cam,
                    "type": "zone_violation",
                    "severity": "critical",
                    "message": "Unauthorized person detected in restricted border zone.",
                    "subject_type": "person",
                    "tracking_id": self._get_next_tracking_id("P")
                }
            }
        elif scenario == "vehicle_anpr":
            return {
                **base_event,
                "event_type": "anpr",
                "data": {
                    "id": str(uuid.uuid4()),
                    "camera_id": "ROAD-01",
                    "plate": self._generate_anpr(),
                    "confidence": round(random.uniform(85, 99), 1),
                    "vehicle_type": random.choice(["SUV", "Truck", "Sedan"]),
                    "tracking_id": self._get_next_tracking_id("V")
                }
            }
        elif scenario == "camera_failure" or scenario == "network_outage":
            return {
                **base_event,
                "event_type": "camera_health",
                "data": {
                    "camera_id": random.choice(self.cameras),
                    "status": "offline",
                    "issue": "Network unreachable" if scenario == "network_outage" else "Hardware failure"
                }
            }
        
        return None

    async def _simulation_loop(self):
        while self.running:
            try:
                # Generate a background event
                if random.random() < 0.3:  # 30% chance per tick to generate an event
                    event_type = random.choice(["detection", "detection", "camera_health"])
                    timestamp = datetime.now(timezone.utc).isoformat()
                    
                    if event_type == "detection":
                        subject = random.choice(["person", "vehicle"])
                        tracking_id = self._get_next_tracking_id("P" if subject == "person" else "V")
                        event = {
                            "event_type": "detection",
                            "data": {
                                "camera_id": random.choice(self.cameras),
                                "subject_type": subject,
                                "tracking_id": tracking_id,
                                "confidence": round(random.uniform(70, 99), 1),
                                "bbox": [random.randint(0, 100), random.randint(0, 100), random.randint(50, 200), random.randint(50, 200)]
                            },
                            "timestamp": timestamp,
                            "simulation": True
                        }
                    else: # camera_health
                         event = {
                            "event_type": "camera_health",
                            "data": {
                                "camera_id": random.choice(self.cameras),
                                "fps": random.randint(15, 30),
                                "latency": random.randint(20, 200)
                            },
                            "timestamp": timestamp,
                            "simulation": True
                         }
                    
                    await broadcast_event(event["event_type"], event)
                
                # Sleep based on speed
                await asyncio.sleep(2.0 / self.speed)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Simulation loop error: {e}")
                await asyncio.sleep(1)

simulation_engine = SimulationEngine()
