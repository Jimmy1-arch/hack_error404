from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_personal_message(self, message: str, session_id: str):
        if session_id in self.active_connections:
            for ws in self.active_connections[session_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    pass

    async def broadcast_status(self, session_id: str, agent_name: str, status: str, output: str = ""):
        payload = {
            "type": "agent_status",
            "agent_name": agent_name,
            "status": status,
            "output": output
        }
        await self.send_personal_message(json.dumps(payload), session_id)

    async def request_approval(self, session_id: str, action_type: str, summary: str, diffs: list = None, commands: list = None):
        payload = {
            "type": "approval_request",
            "action_type": action_type,
            "summary": summary,
            "diffs": diffs or [],
            "terminal_commands": commands or []
        }
        await self.send_personal_message(json.dumps(payload), session_id)

manager = ConnectionManager()
