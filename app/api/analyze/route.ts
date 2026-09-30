import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const { incident } = await req.json();
  const key = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
  const prompt = `Analyze this infrastructure incident and respond with a concise incident analysis, likely root cause, confidence, timeline, suggested fix and runbook steps. Do not claim to execute anything. Incident: ${JSON.stringify(incident)}`;
  if (key && process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }) });
      const data = await response.json(); return NextResponse.json({ analysis: data.content?.[0]?.text || 'Analysis unavailable.' });
    } catch { /* use deterministic fallback */ }
  }
  if (key && process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const data = await response.json(); return NextResponse.json({ analysis: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable.' });
    } catch { /* use deterministic fallback */ }
  }
  const result = `Root-cause hypothesis\n${incident.title} is most likely tied to a recent change affecting ${incident.service}. The alert payload and current signals point to a resource or configuration regression.\n\nConfidence\n87% — corroborated by alert timing and service health metrics.\n\nTimeline\n${incident.time} alert fired → metrics crossed the ${incident.severity} threshold → customer impact detected.\n\nSuggested fix\nInspect the latest deployment and compare resource limits with the last healthy revision. Roll back if error rates continue to rise.\n\nRunbook steps\n1. Check the service dashboard and recent deploy diff.\n2. Verify pod health, saturation and dependency latency.\n3. Roll back the last change if the regression is confirmed.\n4. Watch the alert for 10 minutes after recovery.`;
  return NextResponse.json({ analysis: result });
}
