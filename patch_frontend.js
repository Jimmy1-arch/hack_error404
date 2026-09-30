const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

const oldButton = '<button onClick={()=>setActiveSection(\'Agent Orchestration\')}>✓ Send to Agent</button>';
const newButton = '<button onClick={()=>{ setActiveSection(\'Agent Orchestration\'); fetch(\'http://localhost:8000/api/voice/activate\', {method:\'POST\', headers:{\'Content-Type\':\'application/json\'}, body: JSON.stringify({session_id: \'default\'})}).catch(console.error); }}>✓ Send to Agent</button>';

code = code.replace(oldButton, newButton);

// Add voiceLogs state to AgentOrchestration
const oldState = '  const [fixPlan, setFixPlan] = useState(\'\');';
const newState = '  const [fixPlan, setFixPlan] = useState(\'\');\n  const [voiceLogs, setVoiceLogs] = useState<string[]>([]);';

code = code.replace(oldState, newState);

// Add useEffect for WebSocket
const oldEffect = '  useEffect(() => {\n    let active = true;';
const newEffect = `  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/chat/default');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.log) {
          setVoiceLogs(prev => [...prev, data.log]);
        }
      } catch(err) {}
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    let active = true;`;

code = code.replace(oldEffect, newEffect);

// Append Voice Logs UI below the fixed pipeline
const oldReturn = '    {pipelineState === \'executed\' && (\\n      <div style={{marginTop: 24, padding: 24, background: \'rgba(34, 197, 94, 0.1)\', border: \'1px solid rgba(34, 197, 94, 0.2)\', borderRadius: 8}}>\\n        <h3 style={{color: \'#22c55e\'}}>Fix Executed</h3>\\n        <p style={{fontSize: 14, marginTop: 8}}>The remediation plan was successfully applied and a ticket has been filed.</p>\\n      </div>\\n    )}\\n  </div>;';
const oldReturnActual = code.substring(code.lastIndexOf('{pipelineState === \'executed\''));
// Let's use a simpler regex to insert right before the closing div
const uiEnd = `    {pipelineState === 'executed' && (
      <div style={{marginTop: 24, padding: 24, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 8}}>
        <h3 style={{color: '#22c55e'}}>Fix Executed</h3>
        <p style={{fontSize: 14, marginTop: 8}}>The remediation plan was successfully applied and a ticket has been filed.</p>
      </div>
    )}
    
    {voiceLogs.length > 0 && (
      <div style={{marginTop: 32, padding: '24px 0', borderTop: '1px solid #333'}}>
        <h3 style={{marginBottom: 16, color: '#ccc'}}>Voice Agent Stream</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace', fontSize: 13}}>
          {voiceLogs.map((log, i) => (
             <div key={i} style={{display: 'flex', gap: 12}}>
               <span style={{color: '#888'}}>▶</span>
               <span style={{color: log.includes('approved') || log.includes('resolved') ? '#22c55e' : log.includes('permission') ? '#eab308' : '#e5e7eb'}}>{log}</span>
             </div>
          ))}
        </div>
      </div>
    )}
  </div>;`;

code = code.replace(/    \{pipelineState === 'executed'[^]+?<\/div>;/, uiEnd);

fs.writeFileSync('app/solve/page.tsx', code);
console.log('Frontend patched.');
