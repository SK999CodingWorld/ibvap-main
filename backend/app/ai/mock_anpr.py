from app.ai.interfaces import OCRInterface, ANPRResult, BoundingBox
import random

class MockANPR(OCRInterface):
    async def read_plate(self, plate_image) -> ANPRResult:
        states = ['DL', 'MH', 'KA', 'UP', 'RJ', 'GJ']
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        
        plate = f"{random.choice(states)} {random.randint(1,99):02d} {random.choice(letters)}{random.choice(letters)} {random.randint(1000,9999)}"
        
        return ANPRResult(
            plate_number=plate,
            vehicle_type=random.choice(['Car', 'Motorcycle', 'Truck', 'Bus', 'Van']),
            confidence=random.uniform(0.80, 0.99),
            bbox=BoundingBox(0, 0, 100, 50)
        )
