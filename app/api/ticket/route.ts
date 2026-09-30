import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();
  const model = process.env.TICKET_KB_MODEL || 'qwen2.5:3b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  const systemPrompt = "You are the Ticket & Knowledge Base Agent. Based on the following support ticket, analyze the description, suggest a potential root cause, and identify if there is a known runbook or historical fix for this issue. Be concise.";
  
  const userPrompt = `Ticket Title: ${title}\nDescription: ${description}`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        keep_alive: 0
      })
    });
    
    if (!response.ok) {
      return NextResponse.json({ analysis: 'Ticket KB Agent is unavailable.' });
    }
    
    const data = await response.json();
    return NextResponse.json({ analysis: data.response || 'No analysis available.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ analysis: 'Could not connect to Ollama. Ensure it is running.' });
  }
}
