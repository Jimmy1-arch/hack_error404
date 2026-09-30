from fastapi import APIRouter
from pydantic import BaseModel
import uuid

# In a real app we'd want to manage singleton state to avoid multiple voice agents.
agent_instance = None

router = APIRouter()

class ActivateRequest(BaseModel):
    session_id: str

@router.post("/api/voice/activate")
async def activate_voice_mode(req: ActivateRequest):
    global agent_instance
    if agent_instance is not None:
        # Stop existing agent if running
        try:
            agent_instance.stop()
        except Exception:
            pass
            
    # Start the agent
    # Importing here to prevent blocking main process at startup if modules are slow
    from backend.vscode_voice.agent import VoiceAgent
    agent_instance = VoiceAgent(session_id=req.session_id)
    
    return {"status": "success", "message": "Voice Agent activated"}
