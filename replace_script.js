const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

// Row 1
code = code.replace(
  'output={logFindings} />',
  'taskType="Data Retrieval" taskAction="Analyzing metrics and logs to identify anomalies..." output={logFindings} />'
);

// Row 2
code = code.replace(
  'output={codeFindings} />',
  'taskType="Code Analysis" taskAction="Scanning recent deployment commits and PRs for suspicious changes..." output={codeFindings} />'
);

// Row 3
code = code.replace(
  'output={diagnosis} />',
  'taskType="Synthesis" taskAction="Synthesizing findings into a root-cause hypothesis..." output={diagnosis} />'
);

// Row 4
code = code.replace(
  'output={fixPlan} />',
  'taskType="Execution Planning" taskAction="Drafting remediation steps and generating code patches..." output={fixPlan} />'
);

// Definition
const oldDef = `function AgentRow({name, model, status, output}: {name: string; model: string; status: 'pending'|'running'|'done'|'error'; output: string}) {
  const [expanded, setExpanded] = useState(false);
  return <div style={{border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(255,255,255,0.03)', overflow: 'hidden'}}>
    <div style={{padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: output ? 'pointer' : 'default'}} onClick={() => output && setExpanded(!expanded)}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <b style={{fontSize: 14}}>{name}</b>
        <span style={{fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4}}>{model}</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: 12, color: status === 'running' ? '#38bdf8' : status === 'done' ? '#22c55e' : '#888'}}>
          {status === 'running' ? '● Running...' : status === 'done' ? '✓ Complete' : 'Pending'}
        </span>
        {output && <span style={{fontSize: 12, color: '#888', marginLeft: 8}}>{expanded ? '▲' : '▼'}</span>}
      </div>
    </div>`;

const newDef = `function AgentRow({name, model, status, output, taskType, taskAction}: {name: string; model: string; status: 'pending'|'running'|'done'|'error'; output: string; taskType?: string; taskAction?: string}) {
  const [expanded, setExpanded] = useState(false);
  return <div style={{border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(255,255,255,0.03)', overflow: 'hidden'}}>
    <div style={{padding: '12px 16px', cursor: output ? 'pointer' : 'default'}} onClick={() => output && setExpanded(!expanded)}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <b style={{fontSize: 14}}>{name}</b>
            <span style={{fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4}}>{model}</span>
          </div>
          {taskType && taskAction && (
          <div style={{fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{background: status === 'pending' ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.1)', color: status === 'pending' ? '#888' : '#38bdf8', padding: '2px 6px', borderRadius: 4, fontSize: 10, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5}}>{taskType}</span>
            <span>{status === 'running' || status === 'done' ? taskAction : 'Waiting in queue...'}</span>
          </div>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 4}}>
          <span style={{fontSize: 12, color: status === 'running' ? '#38bdf8' : status === 'done' ? '#22c55e' : '#888'}}>
            {status === 'running' ? '● Running...' : status === 'done' ? '✓ Complete' : 'Pending'}
          </span>
          {output && <span style={{fontSize: 12, color: '#888', marginLeft: 8}}>{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>
    </div>`;

code = code.replace(oldDef.replace(/\n/g, '\r\n'), newDef.replace(/\n/g, '\r\n'));
code = code.replace(oldDef, newDef);

fs.writeFileSync('app/solve/page.tsx', code);
console.log('done');
