from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    session_id: str
    
    # Findings from parallel agents
    log_findings: Dict[str, Any]
    commit_findings: Dict[str, Any]
    ticket_findings: Dict[str, Any]
    
    # Hypothesis and plan
    hypothesis: str
    risk_level: str # "low", "high"
    fix_plan: Dict[str, Any]
    
    # Control flags
    approval_required: bool
    user_approved: bool
    final_resolution: str
