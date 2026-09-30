# DevOps Copilot Backend

This is the FastAPI + LangGraph backend for the DevOps Copilot.

## Architecture

- **FastAPI**: Handles WebSockets (`/ws/chat/{session_id}`) and REST APIs (`/api/approve`).
- **LangGraph**: Orchestrates the Multi-Agent state machine.
- **Ollama**: Models are loaded on-demand per agent call (`keep_alive=0`) to keep the system stable and manage VRAM efficiently.

## Agent Models

- **Conversation Agent**: `qwen3:8b`
- **Orchestrator Agent**: `qwen3:8b`
- **Log Analysis Agent**: `qwen2.5:3b`
- **Code & Commit Agent**: `qwen2.5-coder:7b`
- **Ticket & KB Agent**: `qwen2.5:3b` + `nomic-embed-text`
- **Fix Agent**: `qwen2.5-coder:7b`

## Setup

1. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
   This spins up Redis (for state management, to be integrated) and ChromaDB (for Ticket KB Agent).

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Backend**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Ensure Ollama is running**:
   Make sure Ollama is running locally and you have pulled the required models:
   ```bash
   ollama pull qwen3:8b
   ollama pull qwen2.5:3b
   ollama pull qwen2.5-coder:7b
   ollama pull nomic-embed-text
   ```

## Next Steps for Integration
- The frontend should connect to `ws://localhost:8000/ws/chat/{session_id}`.
- Payload schemas (e.g., status updates, approval requests) are defined in `core/schemas.py`.
