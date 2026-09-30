import { NextRequest, NextResponse } from 'next/server';

async function callOllama(model: string, systemPrompt: string, userPrompt: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
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
    if (!response.ok) return null;
    const data = await response.json();
    return data.response;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { incident } = await req.json();
  
  const orchestratorModel = process.env.ORCHESTRATOR_MODEL || 'qwen3:8b';
  const logModel = process.env.LOG_ANALYSIS_MODEL || 'qwen2.5:3b';
  const codeModel = process.env.CODE_COMMIT_MODEL || 'qwen2.5-coder:7b';
  const fixModel = process.env.FIX_MODEL || 'qwen2.5-coder:7b';
  
  const incidentData = JSON.stringify(incident);
  
  // Tasks (System Prompts)
  const logTask = "You are the Log Analysis Agent. Analyze the incident logs and metrics. Identify anomalies, stack traces, and repeated failure signals. Output a concise structured summary.";
  const codeTask = "You are the Code & Commit Agent. Analyze the incident deploy information and correlate it with the failure. Flag suspicious changes. Output a concise summary.";
  const orchestratorTask = "You are the Orchestrator Agent. Synthesize findings from other agents into a root-cause hypothesis and confidence level. Output 'Root-cause hypothesis', 'Confidence', and 'Timeline'.";
  const fixTask = "You are the Fix Agent. Based on the Orchestrator's hypothesis, draft a remediation plan. Output 'Suggested fix' and 'Runbook steps'.";
  
  // Parallel execution for Log and Code analysis
  const [logFindings, codeFindings] = await Promise.all([
    callOllama(logModel, logTask, incidentData),
    callOllama(codeModel, codeTask, incidentData)
  ]);
  
  if (!logFindings && !codeFindings) {
    return NextResponse.json({ analysis: "Analysis unavailable. Ensure Ollama is running." });
  }
  
  // Synthesis by Orchestrator
  const orchestratorInput = `Incident: ${incidentData}\n\nLog Findings: ${logFindings}\n\nCode Findings: ${codeFindings}`;
  const hypothesis = await callOllama(orchestratorModel, orchestratorTask, orchestratorInput);
  
  // Fix plan by Fix Agent
  const fixPlan = await callOllama(fixModel, fixTask, hypothesis || incidentData);
  
  const finalAnalysis = `${hypothesis}\n\n${fixPlan}`;
  
  return NextResponse.json({ analysis: finalAnalysis });
}
