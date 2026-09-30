import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    // Filter out greetings, redirection messages, and the bare "ticket" trigger word
    const meaningfulMessages = messages.filter((m: any) => {
      const text = (m.text || '').trim().toLowerCase();
      if (!text) return false;
      if (text.startsWith("hi, i’m your devops copilot") || text.startsWith("hi, i'm your devops copilot")) return false;
      if (text.includes("redirecting you to the tickets section")) return false;
      if (text === 'ticket' || text === 'tickets' || text === 'open ticket' || text === 'create ticket') return false;
      return true;
    });

    if (meaningfulMessages.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    const chatTranscript = meaningfulMessages
      .map((m: any) => `${m.role === 'agent' ? 'Copilot' : 'User'}: ${m.text}`)
      .join('\n');

    const model = process.env.TICKET_KB_MODEL || 'qwen2.5:3b';
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

    const systemPrompt = "You are a DevOps support assistant. Summarize the user's technical problem, errors, symptoms, and context from this chat history into a concise, factual problem description for a support ticket. Requirements: State clearly what happened, what went wrong, and any relevant error messages or attached files. Output ONLY the plain text problem summary. Do NOT include chat transcripts, conversational filler, greetings, markdown formatting, or prefixes like 'Summary:' or 'Problem Description:'.";

    const userPrompt = `Chat history:\n${chatTranscript}\n\nProvide only the concise problem summary for the ticket description:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        let summary = (data.response || '').trim();
        summary = summary
          .replace(/^Summary:\s*/i, '')
          .replace(/^Problem Description:\s*/i, '')
          .replace(/^Issue Summary:\s*/i, '')
          .replace(/[*#]/g, '')
          .trim();
        if (summary) {
          return NextResponse.json({ summary });
        }
      }
    } catch (apiErr) {
      clearTimeout(timeoutId);
      console.log('Ollama summarization unavailable or timed out, using fallback summary.');
    }

    // Fast fallback: synthesize from user messages
    const userStatements = meaningfulMessages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.text.replace(/\b(please\s+)?(open|create\s+a?\s*)?ticket\b/gi, '').trim())
      .filter(Boolean);

    const fallbackSummary = userStatements.length > 0
      ? userStatements.join('\n\n')
      : 'User requested assistance with an infrastructure issue.';

    return NextResponse.json({ summary: fallbackSummary });
  } catch (err: any) {
    console.log('Summarize error:', err?.message || err);
    return NextResponse.json({ summary: '' });
  }
}
