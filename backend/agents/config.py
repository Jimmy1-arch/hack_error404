from langchain_ollama import ChatOllama, OllamaEmbeddings

# Load-on-demand per agent call to keep it stable (keep_alive=0)
KEEP_ALIVE = 0

def get_conversation_llm():
    return ChatOllama(model="qwen3:8b", keep_alive=KEEP_ALIVE, temperature=0.7)

def get_orchestrator_llm():
    return ChatOllama(model="qwen3:8b", keep_alive=KEEP_ALIVE, temperature=0.2)

def get_log_analysis_llm():
    return ChatOllama(model="qwen2.5:3b", keep_alive=KEEP_ALIVE, temperature=0.1)

def get_code_commit_llm():
    return ChatOllama(model="qwen2.5-coder:7b", keep_alive=KEEP_ALIVE, temperature=0.1)

def get_ticket_kb_llm():
    return ChatOllama(model="qwen2.5:3b", keep_alive=KEEP_ALIVE, temperature=0.1)

def get_fix_llm():
    return ChatOllama(model="qwen2.5-coder:7b", keep_alive=KEEP_ALIVE, temperature=0.2)

def get_embeddings():
    return OllamaEmbeddings(model="nomic-embed-text")
