import json
from typing import Set
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.connected_clients: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connected_clients.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.connected_clients.discard(websocket)

    async def broadcast_event(self, event_type: str, data: dict):
        message = json.dumps({"type": event_type, "data": data})
        dead_clients = set()
        for client in self.connected_clients:
            try:
                await client.send_text(message)
            except Exception:
                dead_clients.add(client)
        for dead in dead_clients:
            self.connected_clients.discard(dead)

ws_manager = WebSocketManager()

async def broadcast_event(event_type: str, data: dict):
    await ws_manager.broadcast_event(event_type, data)
