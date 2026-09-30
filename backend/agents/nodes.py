from langchain_core.prompts import ChatPromptTemplate
from backend.core.state import AgentState
from backend.agents.config import (
    get_conversation_llm,
    get_orchestrator_llm,
    get_log_analysis_llm,
    get_code_commit_llm,
    get_fix_llm
)
from backend.api.websocket import manager
import json

async def conversation_node(state: AgentState):
    llm = get_conversation_llm()
    # Mock behavior
    last_msg = state.get("messages", [])[-1].content if state.get("messages") else ""
    return {"messages": [{"role": "assistant", "content": "Parsed intent: " + last_msg}]}

async def orchestrator_node(state: AgentState):
    llm = get_orchestrator_llm()
    await manager.broadcast_status(state["session_id"], "Orchestrator", "running", "Delegating tasks...")
    # Mock behavior
    return {"hypothesis": "Potential issue with database connection"}

async def log_analysis_node(state: AgentState):
    llm = get_log_analysis_llm()
    await manager.broadcast_status(state["session_id"], "Log Agent", "running", "Analyzing Elasticsearch logs...")
    # Mock behavior
    return {"log_findings": {"summary": "No explicit errors in the last 15 mins."}}

async def code_commit_node(state: AgentState):
    llm = get_code_commit_llm()
    await manager.broadcast_status(state["session_id"], "Commit Agent", "running", "Checking GitHub diffs...")
    # Mock behavior
    return {"commit_findings": {"summary": "Recent commit removed null check in auth service."}}

async def fix_node(state: AgentState):
    llm = get_fix_llm()
    await manager.broadcast_status(state["session_id"], "Fix Agent", "running", "Evaluating risk...")
    
    # Mock High-Risk logic
    risk_level = "high"
    plan = {"action": "revert", "commit_id": "abc1234"}
    
    if risk_level == "high" and not state.get("user_approved"):
        await manager.request_approval(
            session_id=state["session_id"],
            action_type="Rollback",
            summary="Revert commit abc1234 to restore null check",
            diffs=[{"file_path": "auth_service.py", "diff_content": "- null check removed"}],
            commands=["git revert abc1234"]
        )
        return {"approval_required": True, "risk_level": "high", "fix_plan": plan}
    
    # If low risk or user approved
    return {"approval_required": False, "final_resolution": "Fix applied successfully."}
