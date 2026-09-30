const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

const regex = /logs:\s*\[\'Ticket created: \' \+ t\.createdAt,\s*\'Awaiting triage\'\],\s*metrics:\s*\[0, 0, 0, 0, 0, 0, 0, 0\],\s*deploy:\s*\'N\/A\'/m;

const replacement = `logs: [
          'Ticket created: ' + t.createdAt,
          'Awaiting triage',
          '---',
          'System: Auto-correlating recent events...',
          'WARN: High latency or error rate detected in ' + (t.category || 'support') + ' service',
          'ERR: ' + t.title
        ],
        metrics: [20, 22, 25, 30, 85, 90, 88, 95],
        deploy: \`Deploy v2.1\${Math.floor(Math.random()*10)}.\${Math.floor(Math.random()*10)}\\nCommit: "Fix issue with \${t.title.substring(0, 15)}..."\\nAuthor: DevOps Copilot\\nStatus: Rolled out 5 mins ago\``;

code = code.replace(regex, replacement);
fs.writeFileSync('app/solve/page.tsx', code);
console.log('Replaced successfully');
