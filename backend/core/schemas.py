from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    session_id: str
    message: str
    
class AgentStatus(BaseModel):
    agent_name: str
    status: str # e.g., "running", "success", "error"
    output: Optional[str] = None
    
class DiffPayload(BaseModel):
    file_path: str
    diff_content: str
    
class ApprovalRequest(BaseModel):
    session_id: str
    action_type: str # e.g., "rollback", "patch"
    summary: str
    diffs: Optional[List[DiffPayload]] = None
    terminal_commands: Optional[List[str]] = None
    
class ApprovalResponse(BaseModel):
    session_id: str
    approved: bool
