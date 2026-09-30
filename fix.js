const fs = require('fs');
let code = fs.readFileSync('app/solve/page.tsx', 'utf8');

// replace 1: add bottomRef to setAnalysis('')
code = code.replace(/setAnalysis\(\'\'\);/, "setAnalysis('');\n    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);");

// replace 2: add bottomRef to setAnalysis(data.analysis);
code = code.replace(/setAnalysis\(data\.analysis\);/, "setAnalysis(data.analysis);\n      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);");

// replace 3: remove analysis from ticket-created
const oldTicketCreated = "{loading && <p style={{marginTop: 8}}><em>Copilot is analyzing your ticket...</em></p>}{analysis && <div style={{marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)'}}><b style={{fontSize: 12, color: '#999'}}>COPILOT TICKET ANALYSIS</b><p style={{fontSize: 14, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>{analysis}</p></div>}";
code = code.replace(oldTicketCreated, "");

// replace 4: add analysis to bottom
const oldAsideEnd = "</aside></div></div>";
const newAsideEnd = "</aside></div>\n  {(loading || analysis) && <div className=\"ticket-analysis-block\" style={{marginTop: 32, padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)'}}><b style={{fontSize: 12, color: '#999'}}>COPILOT TICKET ANALYSIS</b>{loading ? <p style={{marginTop: 8}}><em>Copilot is analyzing your ticket...</em></p> : <p style={{fontSize: 14, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>{analysis}</p>}</div>}\n  <div ref={bottomRef} style={{height: 1}} />\n  </div>";
code = code.replace(oldAsideEnd, newAsideEnd);

fs.writeFileSync('app/solve/page.tsx', code);
console.log('done');
