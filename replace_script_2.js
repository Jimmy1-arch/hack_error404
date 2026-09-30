const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

const logsRegex = /logs: \['Ticket created: ' \+ ticket\.createdAt\],\s*metrics: \[20, 20, 20, 20, 20, 20, 20, 20\],\s*deploy: 'N\/A'/;

const logsReplacement = `logs: [
      'Ticket created: ' + ticket.createdAt,
      'Awaiting triage',
      '---',
      'System: Auto-correlating recent events...',
      'WARN: High latency or error rate detected in ' + (ticket.category || 'support') + ' service',
      'ERR: ' + ticket.title
    ],
    metrics: [20, 22, 25, 30, 85, 90, 88, 95],
    deploy: \`Deploy v2.1\${Math.floor(Math.random()*10)}.\${Math.floor(Math.random()*10)}\\nCommit: "Fix issue with \${ticket.title.substring(0, 15)}..."\\nAuthor: DevOps Copilot\\nStatus: Rolled out 5 mins ago\``;

code = code.replace(logsRegex, logsReplacement);

const deployRegex = /<div className="deploy">\{selected\.deploy\}<small>Deployment event · production<\/small><\/div>/;
const deployReplacement = '<pre className="logbox" style={{marginTop: 12, whiteSpace: \\\'pre-wrap\\\'}}>{selected.deploy}</pre>';

code = code.replace(deployRegex, deployReplacement);

fs.writeFileSync('app/solve/page.tsx', code);
console.log("Replacement applied");
