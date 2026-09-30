const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

const oldRender = '<h3 style={{marginTop:25}}>Recent logs</h3><pre className="logbox">{selected.logs.join(\'\\n\')}</pre><h3 style={{marginTop:25}}>Recent deploy</h3><pre className="logbox" style={{marginTop: 12, whiteSpace: \'pre-wrap\'}}>{selected.deploy}</pre>';
const newRender = '<h3 style={{marginTop:25}}>Recent logs</h3><pre className="payload" style={{marginTop: 12, whiteSpace: \'pre-wrap\'}}>{selected.logs.join(\'\\n\')}</pre><h3 style={{marginTop:25}}>Recent deploy</h3><pre className="payload" style={{marginTop: 12, whiteSpace: \'pre-wrap\'}}>{selected.deploy}</pre>';

code = code.replace(oldRender, newRender);

const oldUseEffectMap = `        logs: ['Ticket created: ' + t.createdAt, 'Awaiting triage'],
        metrics: [0, 0, 0, 0, 0, 0, 0, 0],
        deploy: 'N/A'`;
const newUseEffectMap = `        logs: [
          'Ticket created: ' + t.createdAt,
          'Awaiting triage',
          '---',
          'System: Auto-correlating recent events...',
          'WARN: High latency or error rate detected in ' + (t.category || 'support') + ' service',
          'ERR: ' + t.title
        ],
        metrics: [20, 22, 25, 30, 85, 90, 88, 95],
        deploy: \`Deploy v2.1\${Math.floor(Math.random()*10)}.\${Math.floor(Math.random()*10)}\\nCommit: "Fix issue with \${t.title.substring(0, 15)}..."\\nAuthor: DevOps Copilot\\nStatus: Rolled out 5 mins ago\``;

code = code.replace(oldUseEffectMap, newUseEffectMap);

fs.writeFileSync('app/solve/page.tsx', code);
console.log('Replaced');
