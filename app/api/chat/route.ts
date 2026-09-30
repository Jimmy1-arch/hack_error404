import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const model = process.env.CONVERSATION_MODEL || 'qwen3:8b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  const systemPrompt = "You are the Conversation Agent for DevOps Copilot. Maintain a helpful, concise conversation. Help users troubleshoot infrastructure issues, ask clarifying questions, and manage their requests.";
  
  // Format messages for Ollama API
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.text
    }))
  ];

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: false,
        keep_alive: 0
      })
    });
    
    if (!response.ok) {
      return NextResponse.json({ reply: 'Sorry, the Conversation Agent is unavailable.' });
    }
    
    const data = await response.json();
    return NextResponse.json({ reply: data.message?.content || 'No response.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reply: 'Could not connect to Ollama. Ensure it is running.' });
  }
}
