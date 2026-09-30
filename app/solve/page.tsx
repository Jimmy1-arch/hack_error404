'use client';
import { FormEvent, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
type Incident={id:string;title:string;service:string;severity:string;status:string;time:string;summary:string;payload:string;logs:string[];metrics:number[];deploy:string};
const seed:Incident[]=[
 {id:'INC-2048',title:'5xx spike after deploy',service:'checkout-api',severity:'SEV1',status:'Investigating',time:'2m ago',summary:'Error rate reached 18.4% in us-east-1 after release v2.18.4.',payload:'alert: http_5xx_rate > 5%\nservice: checkout-api\nregion: us-east-1\ncurrent: 18.4%\nstarted_at: 14:32:08 UTC',logs:['14:32:08 ERROR upstream timeout: payments-v3','14:32:09 WARN retry budget exhausted','14:32:11 ERROR request failed status=502'],metrics:[18,22,24,34,48,62,78,90],deploy:'v2.18.4 · 14:29 UTC · deploy by j.singh'},
 {id:'INC-2047',title:'Pod CrashLoopBackOff',service:'worker-queue',severity:'SEV2',status:'Investigating',time:'8m ago',summary:'Three workers restarted repeatedly after memory limit reached.',payload:'alert: kube_pod_container_status_restarts_total > 5\nnamespace: production\npods: worker-queue-7b8d (3)',logs:['14:25:42 OOMKilled: container worker','14:25:45 restarting container worker','14:26:02 queue lag now 2,481 messages'],metrics:[22,25,31,45,64,82,80,94],deploy:'worker 1.42.0 · 14:21 UTC · deploy by buildkite'},
 {id:'INC-2046',title:'DB connection pool exhausted',service:'orders-db',severity:'SEV1',status:'Investigating',time:'16m ago',summary:'Connection utilization hit 100%; API requests queuing.',payload:'alert: db_pool_in_use / db_pool_max > .95\ncluster: prod-primary\nin_use: 200 / 200',logs:['14:13:02 FATAL sorry, too many clients','14:13:05 WARN pool wait time 8400ms','14:13:07 ERROR query timeout after 10s'],metrics:[35,37,43,51,63,70,88,96],deploy:'No database deploys in the last 24h'},
 {id:'INC-2045',title:'Disk usage above 90%',service:'ingest-node-03',severity:'SEV2',status:'Acknowledged',time:'28m ago',summary:'Ingestion node volume is 93% full and growing.',payload:'alert: node_filesystem_avail_bytes < 10%\nhost: ingest-node-03\nmount: /var/lib/data',logs:['13:59:12 INFO compaction started','14:01:35 WARN volume 91% full','14:02:04 INFO writing segment 88421'],metrics:[34,38,41,50,56,66,75,84],deploy:'No recent deploys'},
 {id:'INC-2044',title:'TLS certificate expires soon',service:'edge-gateway',severity:'SEV3',status:'Open',time:'41m ago',summary:'Certificate for api.example.com expires in 6 hours.',payload:'alert: certificate_expiry < 24h\nhost: api.example.com\nissuer: Let’s Encrypt',logs:['cert-manager: renewal attempt pending','challenge status: waiting for propagation'],metrics:[22,20,21,22,21,23,22,24],deploy:'Certificate rotation scheduled'},
 {id:'INC-2043',title:'Elevated p95 latency',service:'catalog-api',severity:'SEV2',status:'Investigating',time:'52m ago',summary:'p95 latency increased to 2.8s from 220ms baseline.',payload:'alert: http_request_duration_p95 > 1s\nservice: catalog-api\ncurrent: 2.8s',logs:['14:01:10 WARN redis command latency 740ms','14:01:18 INFO cache hit rate 41%','14:01:20 WARN slow query products_by_tag'],metrics:[17,18,22,30,48,64,82,71],deploy:'Cache config changed · 13:58 UTC'},
 {id:'INC-2042',title:'Queue consumer lag growing',service:'events-stream',severity:'SEV3',status:'Acknowledged',time:'1h ago',summary:'Consumer group is 18 minutes behind.',payload:'alert: kafka_consumer_lag > 10000\ntopic: user-events\nlag: 18442',logs:['13:50:11 INFO partition 4 lag 18,442','13:50:19 WARN consumer rebalance in progress'],metrics:[30,32,36,39,43,48,56,61],deploy:'No recent deploys'},
 {id:'INC-2041',title:'High memory utilization',service:'recommendations',severity:'SEV3',status:'Open',time:'1h ago',summary:'Memory at 88% across recommendation pods.',payload:'alert: container_memory_working_set > 85%\nnamespace: production',logs:['13:40:00 INFO model loaded version 8.4','13:44:08 WARN heap usage 88%'],metrics:[41,44,48,57,62,71,80,88],deploy:'Model 8.4 · 13:36 UTC'},
 {id:'INC-2040',title:'Payment webhook retries',service:'payments-v3',severity:'SEV2',status:'Resolved',time:'2h ago',summary:'Webhook delivery retry rate briefly exceeded threshold.',payload:'alert: webhook_retry_rate > 10%\nprovider: stripe',logs:['12:31:00 INFO provider timeout','12:34:03 INFO delivery recovered'],metrics:[77,64,50,37,28,24,22,20],deploy:'Upstream provider recovered'},
 {id:'INC-2039',title:'Kubernetes node not ready',service:'cluster-west-2',severity:'SEV2',status:'Resolved',time:'3h ago',summary:'Node became temporarily unavailable.',payload:'alert: kube_node_status_condition{Ready=false}\nnode: ip-10-4-3-18',logs:['11:20:02 WARN kubelet heartbeat missed','11:24:09 INFO node Ready'],metrics:[70,54,45,32,25,21,19,18],deploy:'Node recycled by autoscaler'},
 {id:'INC-2038',title:'S3 upload failures',service:'media-service',severity:'SEV3',status:'Open',time:'4h ago',summary:'Upload requests failing intermittently in eu-west-1.',payload:'alert: s3_put_object_errors > 5\nbucket: media-prod-eu',logs:['10:12:41 ERROR RequestTimeout','10:13:12 WARN retrying upload'],metrics:[18,23,32,30,44,50,47,58],deploy:'SDK upgrade · 09:45 UTC'},
 {id:'INC-2037',title:'Certificate chain mismatch',service:'internal-proxy',severity:'SEV4',status:'Resolved',time:'5h ago',summary:'Internal health probe reported an unexpected issuer.',payload:'alert: tls_probe_chain_valid == 0\nendpoint: proxy.internal',logs:['09:04:01 WARN unknown issuer','09:09:02 INFO certificate bundle refreshed'],metrics:[60,51,44,35,30,25,21,18],deploy:'Trust bundle refreshed'}
];
const sevRank=(s:string)=>Number(s.slice(-1));
type Section='Incident inbox'|'Tickets'|'On-call'|'Assistant'|'Integrations'|'Settings';
type Ticket={id:string;title:string;category:string;priority:string;description:string;status:string;createdAt:string};
type ChatMessage={role:'agent'|'user';text:string;time:string;attachmentUrl?:string;attachmentName?:string};

function formatAnalysis(text: string) {
  if (!text) return null;
  let clean = text.replace(/^#+\s*/gm, '');
  return clean.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Solve(){const [incidents,setIncidents]=useState(seed);const [selected,setSelected]=useState(seed[0]);const [search,setSearch]=useState('');const [severity,setSeverity]=useState('All severity');const [service,setService]=useState('All services');const [status,setStatus]=useState('All status');const [analysis,setAnalysis]=useState('');const [running,setRunning]=useState(false);const [toast,setToast]=useState('');const [activeSection,setActiveSection]=useState<Section>('Incident inbox');const [tickets,setTickets]=useState<Ticket[]>([]);const [chatMessages,setChatMessages]=useState<ChatMessage[]>([{role:'agent',text:'Hi, I’m your DevOps Copilot support agent. Tell me what is going wrong, and I’ll help you capture the details or open a support ticket.',time:'Now'}]); const [openBook,setOpenBook]=useState(''); const [range,setRange]=useState('24 hours'); const [prefs,setPrefs]=useState({readOnly:true,approval:true,auto:false});
 useEffect(() => {
    try {
      const rawTickets = JSON.parse(localStorage.getItem('devops-support-tickets') || '[]');
      const loadedTickets = [];
      const seen = new Set();
      for (const t of rawTickets) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          loadedTickets.push(t);
        }
      }
      setTickets(loadedTickets);
      localStorage.setItem('devops-support-tickets', JSON.stringify(loadedTickets));
      const ticketIncidents = loadedTickets.map((t: Ticket) => ({
        id: t.id,
        title: t.title,
        service: t.category || 'support',
        severity: t.priority === 'Urgent' ? 'SEV1' : t.priority === 'High' ? 'SEV2' : t.priority === 'Normal' ? 'SEV3' : 'SEV4',
        status: t.status,
        time: t.createdAt,
        summary: t.description,
        payload: 'User reported issue via support ticket.\n' + t.description.slice(0, 100),
        logs: ['Ticket created: ' + t.createdAt, 'Awaiting triage'],
        metrics: [0, 0, 0, 0, 0, 0, 0, 0],
        deploy: 'N/A'
      }));
      if (ticketIncidents.length > 0) {
        setIncidents(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newIncidents = ticketIncidents.filter((t: any) => !existingIds.has(t.id));
          return [...newIncidents, ...prev];
        });
        setSelected(ticketIncidents[0]);
      }
    } catch {
      setTickets([]);
    }
    try {
      setChatMessages(JSON.parse(localStorage.getItem('devops-support-chat') || 'null') || [{ role: 'agent', text: 'Hi, I’m your DevOps Copilot support agent. Tell me what is going wrong, and I’ll help you capture the details or open a support ticket.', time: 'Now' }]);
    } catch {}
  }, []);
 const services=Array.from(new Set(incidents.map(i=>i.service)));
 const filtered=useMemo(()=>incidents.filter(i=>(severity==='All severity'||i.severity===severity)&&(service==='All services'||i.service===service)&&(status==='All status'||i.status===status)&&`${i.title} ${i.service} ${i.id}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sevRank(a.severity)-sevRank(b.severity)),[incidents,severity,service,status,search]);
 async function run(){setRunning(true);setAnalysis('');
    try{const res=await fetch('/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({incident:selected})});const data=await res.json();for(let i=0;i<data.analysis.length;i+=7){await new Promise(r=>setTimeout(r,10));setAnalysis(data.analysis.slice(0,i+7));}}catch{setAnalysis('Could not reach the analysis service. Please try again.')}finally{setRunning(false)}}
 function changeStatus(next:string){setIncidents(prev=>prev.map(i=>i.id===selected.id?{...i,status:next}:i));setSelected({...selected,status:next});setToast(`${selected.id} ${next.toLowerCase()}`);setTimeout(()=>setToast(''),2200)}
 function simulate(){const n=incidents.length+2049;const item:Incident={id:`INC-${n}`,title:'New alert: elevated error rate',service:'api-gateway',severity:'SEV2',status:'Open',time:'just now',summary:'A new alert was triggered in production.',payload:'alert: http_5xx_rate > 3%\nservice: api-gateway\nregion: us-east-1\ncurrent: 6.8%',logs:['14:42:08 WARN error rate above baseline','14:42:10 INFO new incident simulated'],metrics:[12,17,20,35,46,62,75,81],deploy:'Latest deploy · 14:37 UTC'};setIncidents(p=>[item,...p]);setSelected(item);setAnalysis('');setToast('New incident added to the inbox');setTimeout(()=>setToast(''),2200)}
 function notify(text:string){setToast(text);setTimeout(()=>setToast(''),2400)}
 function createTicket(data:{title:string;category:string;priority:string;description:string}){
  const ticket:Ticket={...data,id:`SUP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,status:'Open',createdAt:new Date().toLocaleString()};
  setTickets(p=>{const next=[ticket,...p];localStorage.setItem('devops-support-tickets',JSON.stringify(next));return next});
  
  const ticketIncident = {
    id: ticket.id,
    title: ticket.title,
    service: ticket.category || 'support',
    severity: ticket.priority === 'Urgent' ? 'SEV1' : ticket.priority === 'High' ? 'SEV2' : ticket.priority === 'Normal' ? 'SEV3' : 'SEV4',
    status: ticket.status,
    time: ticket.createdAt,
    summary: ticket.description,
    payload: 'User reported issue.\n' + ticket.description.slice(0, 100),
    logs: ['Ticket created: ' + ticket.createdAt],
    metrics: [20, 20, 20, 20, 20, 20, 20, 20],
    deploy: 'N/A'
  };
  setIncidents(prev => {
    if (prev.some(i => i.id === ticketIncident.id)) return prev;
    return [ticketIncident, ...prev];
  });
  
  notify(`${ticket.id} created and added to your tickets.`);
  return ticket;
}
 const navItems:Section[]=['Incident inbox','Tickets','On-call','Assistant','Integrations','Settings'];
 return <main className={`solve ${activeSection!=='Incident inbox'?'has-other-view':''}`}><aside className="solve-sidebar"><Link className="brand" href="/"><span className="mark">⌘</span>DevOps Copilot</Link><div className="workspace-tag">WORKSPACE</div>{navItems.map((item,i)=><button key={item} className={`side-item ${activeSection===item?'on':''}`} onClick={()=>setActiveSection(item)}>{['▣','▤','◷','◉','⌘','⚙'][i]} &nbsp; {item}{item==='Incident inbox'&&<span>{incidents.filter(i=>i.status!=='Resolved').length}</span>}{item==='Tickets'&&<span>{tickets.length}</span>}</button>)}<div className="side-bottom"><button className="side-item" onClick={()=>setActiveSection('Settings')}>⚙ &nbsp; Workspace settings</button><Link className="side-item" href="/#faq">↗ &nbsp; Help center</Link></div></aside>
 <section className="solve-main"><div className="solve-top"><b>{activeSection}</b>{activeSection==='Incident inbox'&&<button className="simulate" onClick={simulate}>＋ Simulate new incident</button>}</div><div className="inbox-tools"><input placeholder="⌕  Search incidents" value={search} onChange={e=>setSearch(e.target.value)}/><select value={severity} onChange={e=>setSeverity(e.target.value)}><option>All severity</option>{['SEV1','SEV2','SEV3','SEV4'].map(s=><option key={s}>{s}</option>)}</select><select value={service} onChange={e=>setService(e.target.value)}><option>All services</option>{services.map(s=><option key={s}>{s}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All status</option>{['Open','Investigating','Acknowledged','Resolved','Escalated'].map(s=><option key={s}>{s}</option>)}</select></div><div className="incident-list"><AnimatePresence initial={false}>{filtered.map(item=><motion.article layout initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}} transition={{duration:.22}} className={`incident-row ${item.id===selected.id?'selected':''}`} key={item.id} onClick={()=>{setSelected(item);setAnalysis('')}}><div className="incident-row-title"><span className={`pill sev${item.severity.slice(-1)}`}>{item.severity}</span>{item.title}</div><p>{item.service} · {item.summary}</p><div className="incident-meta"><span className="pill">{item.status}</span><span className="pill">{item.time}</span></div></motion.article>)}</AnimatePresence>{filtered.length===0&&<p style={{padding:18,color:'#888'}}>No incidents match those filters.</p>}</div>{activeSection!=='Incident inbox'&&<WorkspaceSection section={activeSection} incidents={incidents} tickets={tickets} createTicket={createTicket} chatMessages={chatMessages} setChatMessages={setChatMessages} notify={notify} openBook={openBook} setOpenBook={setOpenBook} range={range} setRange={setRange} prefs={prefs} setPrefs={setPrefs} setActiveSection={setActiveSection} onSelectTicket={(id)=>{setActiveSection('Incident inbox'); const inc = incidents.find(i=>i.id===id); if(inc) setSelected(inc);}}/>}</section>
 <section className="detail-pane"><div className="detail-head"><div className="eyebrow">{selected.id} · {selected.time}</div><h2>{selected.title}</h2><div className="detail-tags"><span className={`pill sev${selected.severity.slice(-1)}`}>{selected.severity}</span><span className="pill">{selected.service}</span><span className="pill">{selected.status}</span></div></div><div className="detail-scroll"><h3>Alert summary</h3><p style={{fontSize:12,lineHeight:1.6,color:'#666'}}>{selected.summary}</p><h3>Alert payload</h3><pre className="payload">{selected.payload}</pre><h3>Service health · error rate</h3><div className="sparkline">{selected.metrics.map((n,i)=><i key={i} style={{height:`${n}%`}}/>)}</div><h3 style={{marginTop:25}}>Recent logs</h3><pre className="logbox">{selected.logs.join('\n')}</pre><h3 style={{marginTop:25}}>Recent deploy</h3><div className="deploy">{selected.deploy}<small>Deployment event · production</small></div></div></section>
 <aside className="ai-pane"><div className="ai-head"><span className="mark">✦</span><div>Copilot analysis<small>Grounded in your incident data</small></div></div><div className="ai-body"><div className="ai-intro">I’ve connected the alert, service health signals, logs and recent deployment context. Run an analysis to get a recommended next step.</div><button className="run-button" disabled={running} onClick={run}>{running?'Analyzing incident…':'✦  Run Copilot'}</button>{analysis?<div className="analysis">{formatAnalysis(analysis)}</div>:<div className="analysis" style={{color:'#999'}}>Your incident analysis will appear here with a root-cause hypothesis, confidence level and runbook steps.</div>}</div><div className="ai-actions"><button onClick={()=>changeStatus('Escalated')}>↗ Escalate to on-call</button><button onClick={()=>changeStatus('Resolved')}>✓ Auto-remediate</button></div></aside>{toast&&<div className="toast">{toast}</div>}</main>
}

function TicketIntake({tickets,createTicket,notify,openAssistant,chatMessages,onSelectTicket}:{tickets:Ticket[];createTicket:(data:{title:string;category:string;priority:string;description:string})=>Ticket;notify:(s:string)=>void;openAssistant:()=>void;chatMessages?:ChatMessage[];onSelectTicket?:(id:string)=>void}){

 const [created,setCreated]=useState<Ticket|null>(null);
 const [analysis,setAnalysis]=useState<string>('');
 const [loading,setLoading]=useState(false);
 const [description, setDescription] = useState<string>(() => {
   if (typeof window !== 'undefined') {
     const cached = localStorage.getItem('devops-ticket-summary');
     if (cached) {
       localStorage.removeItem('devops-ticket-summary');
       return cached;
     }
   }
   return '';
 });
 const [summarizing, setSummarizing] = useState(false);
 const bottomRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   if (analysis && !loading) {
     const timer = setTimeout(() => setAnalysis(''), 5000);
     return () => clearTimeout(timer);
   }
 }, [analysis, loading]);

 useEffect(() => {
   if (description) return;
   if (!chatMessages || chatMessages.length <= 1) return;
   const hasUserMsg = chatMessages.some(m => m.role === 'user');
   if (!hasUserMsg) return;

   const cached = localStorage.getItem('devops-ticket-summary');
   if (cached) {
     localStorage.removeItem('devops-ticket-summary');
     setDescription(cached);
     return;
   }

   let active = true;
   setSummarizing(true);
   fetch('/api/chat/summarize', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ messages: chatMessages })
   })
     .then(res => res.json())
     .then(data => {
       if (active && data.summary) {
         setDescription(data.summary);
       }
     })
     .catch(() => {
       if (active) {
         const userMsgs = chatMessages
           .filter(m => m.role === 'user' && !m.text.toLowerCase().includes('ticket'))
           .map(m => m.text)
           .join('\n\n');
         if (userMsgs) setDescription(userMsgs);
       }
     })
     .finally(() => {
       if (active) setSummarizing(false);
     });

   return () => { active = false; };
 }, [chatMessages, description]);
 
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();
   const f=new FormData(e.currentTarget);
   const title = String(f.get('title'));
   const desc = description || String(f.get('description'));
   const ticket=createTicket({title,category:String(f.get('category')),priority:String(f.get('priority')),description:desc});
   setCreated(ticket);
   setDescription('');
   e.currentTarget.reset();
   
   setLoading(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
   setAnalysis('');
   try {
     const res = await fetch('/api/ticket', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ title, description })
     });
     const data = await res.json();
     setAnalysis(data.analysis);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
   } catch (err) {
     setAnalysis('Could not reach Ticket KB Agent.');
   } finally {
     setLoading(false);
   }
 }
 return <div className="workspace-section ticket-view"><div className="section-heading"><div><span className="eyebrow">SUPPORT REQUESTS</span><h2>What can we help with?</h2><p>Describe the problem and we’ll create a trackable support ticket with the details your team needs.</p></div><span className="secure-note">◈ &nbsp; Private to your workspace</span></div>
 <div className="ticket-layout"><form className="ticket-form" onSubmit={submit}><div className="ticket-form-heading"><span className="eyebrow">NEW SUPPORT TICKET</span><h3>Tell us what’s happening</h3><p>Include what you expected and what happened instead.</p></div><label>Short summary<input name="title" required minLength={6} maxLength={120} defaultValue={chatMessages && chatMessages.some(m => m.role === 'user') ? "Support Ticket from Chat" : ""} placeholder="e.g. Deploy is failing in production"/></label><div className="ticket-fields"><label>Issue type<select name="category" required defaultValue=""><option value="" disabled>Select a category</option><option>Incident response</option><option>Integration setup</option><option>Billing and account</option><option>Bug report</option><option>Other</option></select></label><label>Priority<select name="priority" defaultValue="Normal"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label></div><label>Describe the problem{summarizing && <span style={{marginLeft: 8, fontSize: 11, color: '#38bdf8'}}>✦ Summarizing chat history...</span>}<textarea name="description" required minLength={20} rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder={summarizing ? "Generating problem summary from chat history..." : "What were you doing? What went wrong? Include an error message or incident ID if you have one."}/></label><div className="ticket-form-foot"><span>⏱ &nbsp; Typical first response: under 1 business day</span><button type="submit" className="button dark">Create support ticket <span>→</span></button></div></form>
 <aside className="ticket-side"><div className="ticket-side-head"><span className="ticket-side-icon">✦</span><div><b>Need help writing it?</b><small>Copilot Support Agent</small></div></div><p>Tell the assistant what’s wrong, and it can help you organize the details before you submit.</p><button className="text-action" onClick={openAssistant}>Start a conversation →</button><div className="ticket-side-sep"/><b className="recent-ticket-heading">Your recent tickets <span>{tickets.length}</span></b>{tickets.length===0?<p className="empty-tickets">New tickets you create will appear here with their status and reference number.</p>:tickets.slice(0,4).map(t=><div className={`ticket-mini ${t.priority.toLowerCase()}`} key={t.id} style={{cursor: 'pointer'}} onClick={()=>{if(onSelectTicket) onSelectTicket(t.id);}}><span className="ticket-status-dot"/><div><b>{t.title}</b><small>{t.id} · {t.status} · {t.priority}</small></div></div>)}</aside></div>
  {created&&<div className="ticket-created" style={{marginBottom: 32, alignItems: 'flex-start'}}><span className="ticket-created-icon">✓</span><div style={{flex: 1}}><b>Ticket {created.id} is open</b><p>{created.title} · {created.priority} priority · We’ll follow up in this workspace.</p>
    <AnimatePresence>
      {(loading || analysis) && (
        <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }} transition={{ duration: 0.5 }} style={{padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)'}}>
          <b style={{fontSize: 12, color: '#999'}}>COPILOT TICKET ANALYSIS</b>
          {loading ? <p style={{marginTop: 8}}><em>Copilot is analyzing your ticket...</em></p> : <p style={{fontSize: 14, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>{formatAnalysis(analysis)}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  </div><button onClick={()=>{setCreated(null);setAnalysis('');setDescription('');}}>Create another</button></div>}
  <div ref={bottomRef} style={{height: 1}} />
  </div>
}

type ChatSession = { id: string; name: string; messages: ChatMessage[] };
const defaultGreeting: ChatMessage = {role:'agent',text:'Hi, I’m your DevOps Copilot support agent. Tell me what is going wrong, and I’ll help you capture the details or open a support ticket.',time:'Now'};

function SupportChat({messages,setMessages,notify,openTickets}:{messages:ChatMessage[];setMessages:(v:ChatMessage[]|((p:ChatMessage[])=>ChatMessage[]))=>void;notify:(s:string)=>void;openTickets:()=>void}){
 const [draft,setDraft]=useState('');
 const [thinkingSessions,setThinkingSessions]=useState<Record<string, boolean>>({});
 const [attachment,setAttachment]=useState<File|null>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 const [sessions, setSessions] = useState<ChatSession[]>([]);
 const [activeSessionId, setActiveSessionId] = useState<string>('');
 const activeIdRef = useRef('');

 const isThinking = thinkingSessions[activeSessionId] || false;

 useEffect(() => {
   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, isThinking]);

 useEffect(() => {
   try {
     const saved = JSON.parse(localStorage.getItem('devops-support-sessions') || '[]');
     if (saved.length > 0) {
       setSessions(saved);
       setActiveSessionId(saved[0].id);
       activeIdRef.current = saved[0].id;
       setMessages(saved[0].messages);
     } else {
       const initialId = Date.now().toString();
       const initialSession = { id: initialId, name: 'Session 1', messages: [defaultGreeting] };
       setSessions([initialSession]);
       setActiveSessionId(initialId);
       activeIdRef.current = initialId;
       setMessages(initialSession.messages);
       localStorage.setItem('devops-support-sessions', JSON.stringify([initialSession]));
     }
   } catch (e) {}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 function switchSession(id: string) {
   const session = sessions.find(s => s.id === id);
   if (session) {
     setActiveSessionId(id);
     activeIdRef.current = id;
     setMessages(session.messages);
     localStorage.setItem('devops-support-chat', JSON.stringify(session.messages));
   }
 }

 function newSession() {
   const num = sessions.length + 1;
   const initialId = Date.now().toString();
   const newSess: ChatSession = {
     id: initialId,
     name: `Session ${num}`,
     messages: [{...defaultGreeting, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]
   };
   const updated = [newSess, ...sessions];
   setSessions(updated);
   setActiveSessionId(newSess.id);
   activeIdRef.current = newSess.id;
   setMessages(newSess.messages);
   localStorage.setItem('devops-support-sessions', JSON.stringify(updated));
   localStorage.setItem('devops-support-chat', JSON.stringify(newSess.messages));
 }

 function updateActiveSession(newMessages: ChatMessage[], firstUserMsg?: ChatMessage) {
   setSessions(currentSessions => {
     const updated = currentSessions.map(s => {
       if (s.id === activeIdRef.current) {
         let newName = s.name;
         if (firstUserMsg && s.messages.length === 1) { // It's the first user message
           newName = firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? '...' : '');
         }
         return { ...s, name: newName, messages: newMessages };
       }
       return s;
     });
     localStorage.setItem('devops-support-sessions', JSON.stringify(updated));
     return updated;
   });
 }

 async function send(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    
    let attachmentData = null;
    let base64Url = '';
    if (attachment) {
        try {
            attachmentData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    base64Url = e.target?.result as string;
                    resolve({
                        base64: base64Url.split(',')[1],
                        mimeType: attachment.type
                    });
                };
                reader.readAsDataURL(attachment);
            });
        } catch (err) {
            console.error("Failed to read attachment", err);
        }
    }
    
    const textParts = [];
    if (draft.trim()) textParts.push(draft.trim());
    if (attachment) textParts.push(`[Attached File: ${attachment.name}]`);
    const text = textParts.join('\n\n');
    
    if(!text && !attachmentData)return;
    const user:ChatMessage={role:'user',text,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), attachmentUrl: base64Url || undefined, attachmentName: attachment?.name};
    const sessionIdForRequest = activeIdRef.current;
    
    if (draft.toLowerCase().includes('ticket')) {
        const agentMsg:ChatMessage = {role:'agent',text:'Redirecting you to the Tickets section to open a new ticket with our context...',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
        const currentSessionMessages = [...messages, user, agentMsg];
        setMessages(currentSessionMessages);
        localStorage.setItem('devops-support-chat',JSON.stringify(currentSessionMessages));
        updateActiveSession(currentSessionMessages, user);
        setDraft('');
        setAttachment(null);

        // Pre-fetch problem summary for ticket autofill
        fetch('/api/chat/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: currentSessionMessages })
        })
          .then(res => res.json())
          .then(data => {
            if (data.summary) {
              localStorage.setItem('devops-ticket-summary', data.summary);
            }
          })
          .catch(() => {});

        setTimeout(() => openTickets(), 1200);
        return;
    }

    const currentSessionMessages = [...messages, user];
    setMessages(currentSessionMessages);
    localStorage.setItem('devops-support-chat',JSON.stringify(currentSessionMessages));
    updateActiveSession(currentSessionMessages, user);
    setDraft('');
    setAttachment(null);
    setThinkingSessions(prev => ({ ...prev, [sessionIdForRequest]: true }));
   
   try {
     const res = await fetch('/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ messages: currentSessionMessages, attachmentData })
     });
     
     if (!res.ok) throw new Error('API error');
     
     const data = await res.json();
     const agent:ChatMessage={role:'agent',text:data.reply,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
     
     if (activeIdRef.current === sessionIdForRequest) {
       setMessages(current => {
         const next = [...current, agent];
         localStorage.setItem('devops-support-chat',JSON.stringify(next));
         return next;
       });
     }

     setSessions(currentSessions => {
       const updated = currentSessions.map(s => {
         if (s.id === sessionIdForRequest) {
           return { ...s, messages: [...s.messages, agent] };
         }
         return s;
       });
       localStorage.setItem('devops-support-sessions', JSON.stringify(updated));
       return updated;
     });
   } catch (e) {
     const errorMsg:ChatMessage={role:'agent',text:'Network error while reaching the Conversation Agent.',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
     
     if (activeIdRef.current === sessionIdForRequest) {
       setMessages(current => {
         const next = [...current, errorMsg];
         localStorage.setItem('devops-support-chat',JSON.stringify(next));
         return next;
       });
     }

     setSessions(currentSessions => {
       const updated = currentSessions.map(s => {
         if (s.id === sessionIdForRequest) {
           return { ...s, messages: [...s.messages, errorMsg] };
         }
         return s;
       });
       localStorage.setItem('devops-support-sessions', JSON.stringify(updated));
       return updated;
     });
   } finally {
     setThinkingSessions(prev => ({ ...prev, [sessionIdForRequest]: false }));
   }
 }
 return <div className="workspace-section assistant-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
  <div className="section-heading"><div><span className="eyebrow">SUPPORT CONVERSATION</span><h2>Chat with Copilot</h2><p>Describe an issue, get guided next steps, or open a trackable support ticket.</p></div><span className="agent-presence"><i/> Agent available</span></div>
  <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
    <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingRight: 5 }}>
      <button onClick={newSession} style={{ background: '#f5f5f4', border: '1px solid #e0e4df', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
        New session <span>＋</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sessions.map(s => (
          <button key={s.id} onClick={() => switchSession(s.id)} style={{ background: s.id === activeSessionId ? '#171717' : 'transparent', color: s.id === activeSessionId ? '#fff' : '#555', border: 'none', textAlign: 'left', padding: '10px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: s.id === activeSessionId ? 500 : 400 }}>
            {s.name}
          </button>
        ))}
      </div>
    </aside>
    <div className="chat-shell" style={{ flex: 1, height: '100%' }}>
      <header className="chat-header"><span className="chat-agent-mark">✦</span><div><b>Copilot Support Agent</b><small><i/> Usually replies instantly</small></div></header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((m,i)=><div className={`chat-message ${m.role}`} key={`${i}-${m.time}`}><span className="chat-avatar">{m.role==='agent'?'✦':'You'}</span><div className="chat-bubble-wrap"><small>{m.role==='agent'?'Copilot Support Agent':'You'} · {m.time}</small><div className="chat-bubble">{m.attachmentUrl && <div style={{marginBottom: 10}}><img src={m.attachmentUrl} alt={m.attachmentName||'attachment'} style={{maxWidth: '100%', borderRadius: 8, border: '1px solid #e0e4df'}}/></div>}{formatAnalysis(m.text)}</div></div></div>)}
        {isThinking && <div className="chat-message agent"><span className="chat-avatar">✦</span><div className="chat-bubble-wrap"><small>Copilot Support Agent · Thinking</small><div className="chat-bubble"><motion.div style={{display:'flex',gap:4,padding:4}}><motion.span animate={{opacity:[0.3,1,0.3]}} transition={{repeat:Infinity,duration:1.2,delay:0}} style={{width:6,height:6,borderRadius:'50%',background:'currentColor'}}/><motion.span animate={{opacity:[0.3,1,0.3]}} transition={{repeat:Infinity,duration:1.2,delay:0.2}} style={{width:6,height:6,borderRadius:'50%',background:'currentColor'}}/><motion.span animate={{opacity:[0.3,1,0.3]}} transition={{repeat:Infinity,duration:1.2,delay:0.4}} style={{width:6,height:6,borderRadius:'50%',background:'currentColor'}}/></motion.div></div></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-compose" onSubmit={send} style={{flexDirection: 'column', alignItems: 'stretch', borderRadius: attachment ? 18 : 27, padding: attachment ? '12px 6px 6px 16px' : undefined}}>
        {attachment && <div style={{display:'flex', gap: 10, paddingBottom: 10}}><div style={{display:'flex', alignItems:'center', gap: 10, background: '#f5f5f4', border: '1px solid #e0e4df', padding: '12px 14px', borderRadius: 12, position: 'relative', maxWidth: '240px'}}><div style={{background: '#08a765', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 6px', borderRadius: 4, letterSpacing: 0.5}}>{attachment.name.split('.').pop()?.toUpperCase() || 'FILE'}</div><div style={{fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: '#333'}}>{attachment.name}</div><button type="button" onClick={()=>setAttachment(null)} style={{position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '1px solid #ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', boxShadow: '0 2px 5px rgba(0,0,0,0.08)'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div></div>}
        <div style={{display: 'flex', alignItems: 'center', gap: 10, width: '100%'}}><label style={{display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:'50%',background:'transparent',cursor:'pointer',flexShrink:0, opacity:0.6}}><input type="file" style={{display:'none'}} onChange={e=>setAttachment(e.target.files?.[0]||null)}/><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></label><input value={draft} onChange={e=>setDraft(e.target.value)} aria-label="Message the support agent" placeholder="Describe the issue or ask a question…" style={{flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontSize: 14}}/><button className="button dark" type="submit" disabled={(!draft.trim() && !attachment)||isThinking}>Send <span>↑</span></button></div>
      </form>
      <div className="chat-privacy">Your conversation is saved in this browser workspace. Don’t share passwords or API keys.<br/><b>Note:</b> Attached files are processed via a third-party API (Gemini) to extract visible text. Please redact any sensitive data.</div>
    </div>
  </div>
 </div>
}

function IntegrationsPanel({notify}:{notify:(s:string)=>void}){
 const apps=[{name:'PagerDuty',kind:'On-call management',mark:'P',tint:'rose'},{name:'Slack',kind:'Team communication',mark:'#',tint:'violet'},{name:'GitHub',kind:'Source control & deploys',mark:'⌘',tint:'dark'},{name:'Datadog',kind:'Metrics, logs & traces',mark:'◒',tint:'purple'},{name:'Kubernetes',kind:'Container platform',mark:'⎈',tint:'blue'},{name:'Amazon Web Services',kind:'Cloud infrastructure',mark:'aws',tint:'orange'}];
 const [connected,setConnected]=useState<string[]>(['PagerDuty','Slack']);useEffect(()=>{try{setConnected(JSON.parse(localStorage.getItem('devops-connected-apps')||'["PagerDuty","Slack"]'))}catch{}} ,[]);
 function toggle(name:string){setConnected(prev=>{const next=prev.includes(name)?prev.filter(n=>n!==name):[...prev,name];localStorage.setItem('devops-connected-apps',JSON.stringify(next));notify(`${name} ${next.includes(name)?'connected':'disconnected'} in this demo workspace.`);return next})}
 return <div className="workspace-section integrations-view"><div className="section-heading"><div><span className="eyebrow">YOUR TOOLCHAIN</span><h2>Connected apps</h2><p>Bring alerts, deployments, and team context into one workspace.</p></div><span className="secure-note">◈ &nbsp; Scoped access · Read-only by default</span></div><div className="integration-banner"><div><b>One workspace, connected context</b><p>Connect the tools your team already uses. You control access and can disconnect at any time.</p></div><span>{connected.length} connected</span></div><div className="connected-app-grid">{apps.map(app=>{const on=connected.includes(app.name);return <article className={`connected-app ${on?'is-connected':''}`} key={app.name}><div className="connected-app-top"><span className={`app-mark ${app.tint}`}>{app.mark}</span><span className={`connection-state ${on?'on':''}`}><i/>{on?'Connected':'Available'}</span></div><h3>{app.name}</h3><p>{app.kind}</p><div className="app-permissions"><span>✓ Incident context</span><span>✓ Workspace scoped</span></div><button className={on?'disconnect-button':'connect-button'} onClick={()=>toggle(app.name)}>{on?'Manage connection':'Connect app'} <span>{on?'⚙':'＋'}</span></button></article>})}</div><p className="integration-footnote">Connections shown here are interactive demo states. Real provider authorization requires workspace credentials.</p></div>
}

function WorkspaceSection({section,incidents,tickets,createTicket,chatMessages,setChatMessages,notify,openBook,setOpenBook,range,setRange,prefs,setPrefs,setActiveSection,onSelectTicket}:{section:Section;incidents:Incident[];tickets:Ticket[];createTicket:(data:{title:string;category:string;priority:string;description:string})=>Ticket;chatMessages:ChatMessage[];setChatMessages:(v:ChatMessage[]|((p:ChatMessage[])=>ChatMessage[]))=>void;notify:(s:string)=>void;openBook:string;setOpenBook:(s:string)=>void;range:string;setRange:(s:string)=>void;prefs:{readOnly:boolean;approval:boolean;auto:boolean};setPrefs:(v:{readOnly:boolean;approval:boolean;auto:boolean})=>void;setActiveSection:(s:Section)=>void;onSelectTicket?:(id:string)=>void}){
 const active=incidents.filter(i=>i.status!=='Resolved');
 return <div className="workspace-section" key={section}>
 {section==='On-call'&&<><div className="section-heading"><div><span className="eyebrow">PEOPLE & COVERAGE</span><h2>On-call schedule</h2><p>See who is carrying the pager and acknowledge the incidents that need a human.</p></div><button className="simulate" onClick={()=>notify('Schedule rotation preview updated.')}>⇄ Preview rotation</button></div><div className="oncall-banner"><div className="avatar-stack"><span>JS</span><span>MC</span><span>RP</span></div><div><b>Primary rotation · Platform</b><small>Current shift ends today at 18:00 UTC · 6h 14m remaining</small></div><span className="status-chip">● On shift</span></div><div className="workspace-cards"><article className="workspace-card duty"><span className="eyebrow">PRIMARY · ACTIVE NOW</span><h3>Jaya Singh</h3><p>Platform engineer · UTC−5</p><div className="duty-contact">⌁ &nbsp; PagerDuty connected<br/>✉ &nbsp; jaya@acme.dev</div><button className="text-action" onClick={()=>notify('Handoff note opened for Jaya Singh.')}>Prepare handoff note →</button></article><article className="workspace-card duty"><span className="eyebrow">SECONDARY</span><h3>Marcus Chen</h3><p>Senior SRE · UTC+0</p><div className="duty-contact">⌁ &nbsp; Escalation target<br/>◷ &nbsp; Next shift: today, 18:00 UTC</div><button className="text-action" onClick={()=>notify('Marcus Chen added as the incident follower.')}>Add as incident follower →</button></article></div><h3 className="list-heading">Needs acknowledgement <span>{active.length}</span></h3>{active.slice(0,4).map(i=><div className="compact-row" key={i.id}><span className={`pill sev${i.severity.slice(-1)}`}>{i.severity}</span><b>{i.title}</b><span>{i.service}</span><button onClick={()=>notify(`${i.id} acknowledged by you.`)}>Acknowledge</button></div>)}</>}
 {section==='Tickets'&&<TicketIntake tickets={tickets} createTicket={createTicket} notify={notify} openAssistant={()=>setActiveSection('Assistant')} chatMessages={chatMessages} onSelectTicket={onSelectTicket}/>}
 {section==='Assistant'&&<SupportChat messages={chatMessages} setMessages={setChatMessages} notify={notify} openTickets={()=>setActiveSection('Tickets')}/>}
 {section==='Integrations'&&<IntegrationsPanel notify={notify}/>}
 {section==='Settings'&&<><div className="section-heading"><div><span className="eyebrow">WORKSPACE CONTROLS</span><h2>Settings</h2><p>Choose how the copilot handles suggestions, approvals and production access.</p></div></div><div className="settings-list">{[{key:'readOnly',title:'Read-only connections',desc:'Connected monitoring data can be inspected without granting write access.'},{key:'approval',title:'Require approval for changes',desc:'A person must review and approve every production remediation.'},{key:'auto',title:'Allow automatic remediation',desc:'Enable only after reviewing scoped permissions and your organization policy.'}].map(item=><div className="setting-row" key={item.key}><div><b>{item.title}</b><p>{item.desc}</p></div><button aria-label={`Toggle ${item.title}`} className={`toggle ${prefs[item.key as keyof typeof prefs]?'checked':''}`} onClick={()=>{const next={...prefs,[item.key]:!prefs[item.key as keyof typeof prefs]};setPrefs(next);localStorage.setItem('devops-workspace-prefs',JSON.stringify(next));notify(`${item.title} ${next[item.key as keyof typeof next]?'enabled':'disabled'}.`)}}><i/></button></div>)}</div><div className="safety-note"><span>◈</span><p><b>Connected workspace</b><br/>Demo data only · No provider credentials connected · Audit history enabled</p></div><button className="simulate" onClick={()=>notify('Workspace access report downloaded.')}>Download access report</button></>}
 </div>
}





