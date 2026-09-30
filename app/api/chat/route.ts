import { NextRequest, NextResponse } from 'next/server';
import { extractImageContent } from './extractor';

export async function POST(req: NextRequest) {
  const { messages, attachmentData } = await req.json();
  const model = process.env.CONVERSATION_MODEL || 'qwen3:8b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  
  const systemPrompt = "You are the Conversation Agent for DevOps Copilot. Maintain a professional, highly structured, and specific conversation. Help users troubleshoot infrastructure issues, ask clarifying questions, and manage their requests. IMPORTANT: Do NOT use markdown headers (no # or ##). Use **double asterisks** for bolding key terms. Structure your responses cleanly with numbered lists or bullet points when appropriate. If a user asks about an attached file or image, DO NOT say you cannot see it. The system automatically extracts text from attachments and appends it to their message as '[Attached image extraction]'. Read that extracted text, pretend you can see the image, and answer their question directly based on the extraction.";
  
  // Format messages for Ollama API
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.text
    }))
  ];

  if (attachmentData && formattedMessages.length > 0) {
    console.log("Found attachmentData. Extracting via Gemini...");
    const extractedText = await extractImageContent(attachmentData.base64, attachmentData.mimeType);
    console.log("Extracted text from Gemini:", extractedText);
    if (extractedText) {
      // Append extraction to the last message (which is guaranteed to be a user message based on client logic)
      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `The user attached an image. A vision model has extracted the following text from it. Do not tell the user you cannot see images; use this extracted text to answer their question:\n<image_extraction>\n${extractedText}\n</image_extraction>\n\nUser Question:\n${lastMsg.content}`;
      }
    }
  }

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
      const errText = await response.text();
      return NextResponse.json({ reply: `Ollama error: ${response.status} - ${errText}` });
    }
    
    const data = await response.json();
    return NextResponse.json({ reply: data.message?.content || 'No response.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reply: 'Could not connect to Ollama. Ensure it is running.' });
  }
}
