from langchain_core.prompts import ChatPromptTemplate
from backend.core.state import AgentState
from backend.agents.config import get_ticket_kb_llm
import asyncio

TICKET_AGENT_PROMPT = """You are the Ticket & Knowledge Base Agent for an AI troubleshooting co-pilot.

Your job: given a structured incident description (error codes, affected 
service, timeframe), find similar past tickets, incident reports, and 
runbooks, and surface what root causes and fixes were confirmed to work.

Data source: a ChromaDB collection of embedded historical tickets/runbooks 
(embeddings generated via nomic-embed-text). To search, embed the incident 
description with nomic-embed-text and query the collection for the top-k 
most similar entries. Use metadata filters (error_code, service, date range) 
to narrow results when the incident provides exact identifiers.

Do not fabricate past incidents or fixes. If no sufficiently similar match 
is found (low similarity score), say so clearly rather than forcing a match.

Output a concise structured summary: matched ticket ID(s), root cause, fix 
applied, and your confidence based on similarity score — for the 
Orchestrator to use as historical context.

Incident Description: {incident_description}
ChromaDB Search Results (mocked for now): {search_results}
"""

async def ticket_kb_node(state: AgentState):
    llm = get_ticket_kb_llm()
    prompt = ChatPromptTemplate.from_template(TICKET_AGENT_PROMPT)
    chain = prompt | llm
    
    # In a real implementation, we would extract the incident description, 
    # query ChromaDB with Nomic embeddings, and pass results here.
    incident_desc = state.get("messages")[-1].content if state.get("messages") else ""
    
    # Mocking ChromaDB results for initial dev
    mock_results = "No high-confidence matches found in KB."
    
    response = await chain.ainvoke({
        "incident_description": incident_desc,
        "search_results": mock_results
    })
    
    return {"ticket_findings": {"summary": response.content}}
