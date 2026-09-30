from langgraph.graph import StateGraph, END
from backend.core.state import AgentState
from backend.agents.nodes import (
    conversation_node,
    orchestrator_node,
    log_analysis_node,
    code_commit_node,
    fix_node
)
from backend.agents.ticket_kb import ticket_kb_node

def should_continue_fix(state: AgentState):
    if state.get("approval_required") and not state.get("user_approved"):
        return END # Pause execution for human-in-the-loop
    return END # Or continue to reporting/resolution in a fuller graph

def create_workflow():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("conversation", conversation_node)
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("log_agent", log_analysis_node)
    workflow.add_node("commit_agent", code_commit_node)
    workflow.add_node("ticket_agent", ticket_kb_node)
    workflow.add_node("fix_agent", fix_node)
    
    # 1. Intake
    workflow.set_entry_point("conversation")
    workflow.add_edge("conversation", "orchestrator")
    
    # 2. Delegation (Fan-out)
    workflow.add_edge("orchestrator", "log_agent")
    workflow.add_edge("orchestrator", "commit_agent")
    workflow.add_edge("orchestrator", "ticket_agent")
    
    # 3. Synthesis (Fan-in)
    # LangGraph runs parallel branches and merges them into the next node.
    # We can connect them all to the orchestrator again, or directly to fix.
    # For simplicity, we assume they all need to finish before fix_agent
    workflow.add_edge("log_agent", "fix_agent")
    workflow.add_edge("commit_agent", "fix_agent")
    workflow.add_edge("ticket_agent", "fix_agent")
    
    # 4. Risk Evaluation & Human-in-the-loop
    workflow.add_conditional_edges("fix_agent", should_continue_fix)
    
    return workflow.compile()

app_graph = create_workflow()
