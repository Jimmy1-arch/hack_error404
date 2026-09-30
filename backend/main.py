from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from fastapi.middleware.cors import CORSMiddleware
from backend.api.websocket import manager
from backend.agents.graph import app_graph
from backend.core.schemas import ChatMessage, ApprovalResponse
from backend.api.voice import router as voice_router

app = FastAPI(title="DevOps Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)

@app.websocket("/ws/chat/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                # Try parsing as JSON first
                parsed_data = json.loads(data)
                if "log" in parsed_data or "status" in parsed_data:
                    # Broadcast to all connected clients in this session
                    await manager.send_personal_message(data, session_id)
                    continue
            except json.JSONDecodeError:
                pass
            
            # On receiving a regular text message, trigger the LangGraph workflow
            initial_state = {
                "session_id": session_id,
                "messages": [{"role": "user", "content": data}],
                "approval_required": False,
                "user_approved": False
            }
            # Start workflow asynchronously
            # Note: app_graph.ainvoke handles async node execution
            result = await app_graph.ainvoke(initial_state)
            
            # Optionally send final result back to UI
            if not result.get("approval_required"):
                await manager.send_personal_message(
                    f"Final Resolution: {result.get('final_resolution', 'Done')}", 
                    session_id
                )
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)

@app.post("/api/approve")
async def approve_action(response: ApprovalResponse):
    """ Endpoint to handle Human-in-the-loop approval from the frontend """
    # In a real LangGraph setup with persistency (Redis), we would fetch the paused state,
    # update 'user_approved', and resume the graph execution.
    return {"status": "success", "message": f"Action {'approved' if response.approved else 'rejected'} for session {response.session_id}"}
