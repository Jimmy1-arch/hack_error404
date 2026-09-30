const fs = require('fs');
let c = fs.readFileSync('app/solve/page.tsx', 'utf8');

// 1. Remove the existing ticket-created block
const ticketCreatedRegex = /  \{created&&<div className="ticket-created">.*?<\/div>\}/;
c = c.replace(ticketCreatedRegex, '');

// 2. Remove the existing ticket-analysis-block at the bottom
const analysisBlockRegex = /  \{\(loading \|\| analysis\) && <div className="ticket-analysis-block" style=\{\{marginTop: 32, padding: 24, background: 'rgba\(255,255,255,0\.05\)', borderRadius: 6, border: '1px solid rgba\(255,255,255,0\.1\)'\}\}><b style=\{\{fontSize: 12, color: '#999'\}\}>COPILOT TICKET ANALYSIS<\/b>\{loading \? <p style=\{\{marginTop: 8\}\}><em>Copilot is analyzing your ticket\.\.\.<\/em><\/p> : <p style=\{\{fontSize: 14, marginTop: 6, lineHeight: 1\.5, whiteSpace: 'pre-wrap'\}\}>\{analysis\}<\/p><\/div>\}/;
c = c.replace(analysisBlockRegex, '');

// 3. Inject the combined green tile with framer-motion at the bottom, just before <div ref={bottomRef}
const bottomRefIndex = c.indexOf('<div ref={bottomRef}');
if (bottomRefIndex > -1) {
  const injection = `
  {created&&<div className="ticket-created" style={{marginBottom: 32, alignItems: 'flex-start'}}><span className="ticket-created-icon">✓</span><div style={{flex: 1}}><b>Ticket {created.id} is open</b><p>{created.title} · {created.priority} priority · We’ll follow up in this workspace.</p>
    <AnimatePresence>
      {(loading || analysis) && (
        <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }} transition={{ duration: 0.5 }} style={{padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)'}}>
          <b style={{fontSize: 12, color: '#999'}}>COPILOT TICKET ANALYSIS</b>
          {loading ? <p style={{marginTop: 8}}><em>Copilot is analyzing your ticket...</em></p> : <p style={{fontSize: 14, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>{analysis}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  </div><button onClick={()=>{setCreated(null);setAnalysis('');setDescription('');}}>Create another</button></div>}
  `;
  c = c.slice(0, bottomRefIndex) + injection + c.slice(bottomRefIndex);
}

fs.writeFileSync('app/solve/page.tsx', c);
console.log('Fixed');
