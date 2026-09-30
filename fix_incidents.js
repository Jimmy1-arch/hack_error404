const fs = require('fs');
let c = fs.readFileSync('app/solve/page.tsx', 'utf8');

// Replace useEffect
const oldUseEffect = /useEffect\(\(\)=>\{try\{setTickets\(JSON\.parse\(localStorage\.getItem\('devops-support-tickets'\)\|\|'\[\]'\)\)\}catch\{setTickets\(\[\]\)\}try\{setChatMessages\(JSON\.parse\(localStorage\.getItem\('devops-support-chat'\)\|\|'null'\)\|\|\[\{role:'agent',text:'Hi, I’m your DevOps Copilot support agent\. Tell me what is going wrong, and I’ll help you capture the details or open a support ticket\.',time:'Now'\}\]\)\}catch\{\}\},\[\]\);/;

const newUseEffect = `useEffect(() => {
    try {
      const loadedTickets = JSON.parse(localStorage.getItem('devops-support-tickets') || '[]');
      setTickets(loadedTickets);
      const ticketIncidents = loadedTickets.map((t) => ({
        id: t.id,
        title: t.title,
        service: t.category || 'support',
        severity: t.priority === 'Urgent' ? 'SEV1' : t.priority === 'High' ? 'SEV2' : t.priority === 'Normal' ? 'SEV3' : 'SEV4',
        status: t.status,
        time: t.createdAt,
        summary: t.description,
        payload: 'User reported issue via support ticket.\\n' + t.description.slice(0, 100),
        logs: ['Ticket created: ' + t.createdAt, 'Awaiting triage'],
        metrics: [0, 0, 0, 0, 0, 0, 0, 0],
        deploy: 'N/A'
      }));
      if (ticketIncidents.length > 0) {
        setIncidents(prev => [...ticketIncidents, ...prev]);
        setSelected(ticketIncidents[0]);
      }
    } catch {
      setTickets([]);
    }
    try {
      setChatMessages(JSON.parse(localStorage.getItem('devops-support-chat') || 'null') || [{ role: 'agent', text: 'Hi, I’m your DevOps Copilot support agent. Tell me what is going wrong, and I’ll help you capture the details or open a support ticket.', time: 'Now' }]);
    } catch {}
  }, []);`;

c = c.replace(oldUseEffect, newUseEffect);

// Replace createTicket
const oldCreateTicket = /function createTicket\(data:\{title:string;category:string;priority:string;description:string\}\)\{const ticket:Ticket=\{.*?return ticket\}/;
const newCreateTicket = `function createTicket(data:{title:string;category:string;priority:string;description:string}){
  const ticket:Ticket={...data,id:\`SUP-\${new Date().getFullYear()}-\${String(Date.now()).slice(-6)}\`,status:'Open',createdAt:new Date().toLocaleString()};
  setTickets(p=>{const next=[ticket,...p];localStorage.setItem('devops-support-tickets',JSON.stringify(next));return next});
  
  const ticketIncident = {
    id: ticket.id,
    title: ticket.title,
    service: ticket.category || 'support',
    severity: ticket.priority === 'Urgent' ? 'SEV1' : ticket.priority === 'High' ? 'SEV2' : ticket.priority === 'Normal' ? 'SEV3' : 'SEV4',
    status: ticket.status,
    time: ticket.createdAt,
    summary: ticket.description,
    payload: 'User reported issue.\\n' + ticket.description.slice(0, 100),
    logs: ['Ticket created: ' + ticket.createdAt],
    metrics: [20, 20, 20, 20, 20, 20, 20, 20],
    deploy: 'N/A'
  };
  setIncidents(prev => [ticketIncident, ...prev]);
  
  notify(\`\${ticket.id} created and added to your tickets.\`);
  return ticket;
}`;

c = c.replace(oldCreateTicket, newCreateTicket);

fs.writeFileSync('app/solve/page.tsx', c);
console.log('Fixed');
