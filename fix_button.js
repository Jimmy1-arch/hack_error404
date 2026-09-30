const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

const oldBtn = "<button onClick={()=>{ setActiveSection('Agent Orchestration'); fetch('http://localhost:8000/api/voice/activate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({session_id: 'default'})}).catch(console.error); }}>✓ Send to Agent</button>";
const newBtn = "<button onClick={()=>{ fetch('http://localhost:8000/api/voice/activate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({session_id: 'default'})}).catch(console.error); notify('Voice Agent activated across all windows.'); }}>✓ Send to Agent</button>";

if (code.includes(oldBtn)) {
  code = code.replace(oldBtn, newBtn);
  fs.writeFileSync('app/solve/page.tsx', code);
  console.log('Button fixed.');
} else {
  console.log('Button not found.');
}
