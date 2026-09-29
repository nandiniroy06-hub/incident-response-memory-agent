const E = React.createElement;
const API = "/api";

const DEMO = {
  title: "Payment API returning 503 after deployment",
  service: "Payment API",
  description: "The payment service started returning HTTP 503 errors immediately after the latest deployment. Health checks are failing and payment requests are timing out."
};

function Button({children, onClick, disabled, primary=false}) {
  return E("button",{className:"btn " + (primary ? "primary" : "secondary"),onClick,disabled},children);
}
function Field({label, value, onChange, placeholder, textarea=false}) {
  const props={className:textarea?"textarea":"input",value,onChange:e=>onChange(e.target.value),placeholder};
  return E("div",{className:"field"},E("label",null,label),E(textarea?"textarea":"input",props));
}
function Panel({kicker,title,children,full=false,right}) {
  return E("div",{className:"panel"+(full?" full":"")},
    E("div",{className:"panel-head"},
      E("div",null,E("div",{className:"panel-kicker"},kicker),E("h2",null,title)),
      right||null
    ),children
  );
}
function MemoryCard({memory}) {
  const source=(memory.source||"")+"\n"+(memory.text||"");
  const pick=label=>{const m=source.match(new RegExp(label+":\\s*([^\\n]+)","i"));return m?m[1].trim():"";};
  const title=pick("Incident title")||"Recalled incident experience";
  const service=pick("Service");
  const symptoms=pick("Symptoms / description");
  const rootCause=pick("Root cause");
  const resolution=pick("Resolution");
  return E("article",{className:"memory"},
    E("div",{className:"memory-title"},title),
    E("div",{className:"memory-meta"},service&&E("span",{className:"tag"},service),E("span",{className:"tag"},"Hindsight · "+memory.type)),
    symptoms&&E(React.Fragment,null,E("div",{className:"label"},"Symptoms"),E("p",null,symptoms)),
    rootCause&&E(React.Fragment,null,E("div",{className:"label"},"Previous root cause"),E("p",null,rootCause)),
    resolution&&E(React.Fragment,null,E("div",{className:"label"},"Previous resolution"),E("p",null,resolution)),
    !symptoms&&!rootCause&&!resolution&&E("p",null,memory.text||"No fact text returned."),
    E("div",{className:"label"},"Relevance / context"),
    E("p",null,memory.context||"Persistent Hindsight memory retrieved for this incident.")
  );
}
function Flow() {
  const steps=["NEW INCIDENT","HINDSIGHT RECALL","PAST INCIDENTS","AI ANALYSIS","RESOLUTION","HINDSIGHT RETAIN","FUTURE INCIDENTS"];
  const icons=["↳","⌁","◈","✦","✓","↺","∞"];
  return E("div",{className:"flow"},steps.map((s,i)=>E(React.Fragment,{key:s},
    E("div",{className:"step"},E("strong",null,s),E("span",null,icons[i]),E("div",{className:"muted"},i===1?"persistent retrieval":i===2?"historical context":i===5?"learns permanently":" ")),
    i<steps.length-1&&E("div",{className:"arrow"},"→")
  )));
}
function App() {
  const [incident,setIncident]=React.useState({title:"",service:"",description:""});
  const [result,setResult]=React.useState(null);
  const [resolution,setResolution]=React.useState({rootCause:"",resolution:"",outcome:""});
  const [busy,setBusy]=React.useState("");
  const [notice,setNotice]=React.useState(null);
  const [retained,setRetained]=React.useState(false);

  const setI=(k,v)=>setIncident(p=>({...p,[k]:v}));
  const post=async(path,body)=>{
    const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||"Request failed.");
    return d;
  };
  const loadDemo=()=>{setIncident(DEMO);setResult(null);setRetained(false);setNotice(null);};
  const analyze=async()=>{
    setBusy("analyze");setNotice(null);setResult(null);setRetained(false);
    try{const d=await post("/incidents/analyze",incident);setResult(d);setNotice({type:"success",text:"Hindsight recalled "+d.memoryCount+" relevant experience"+(d.memoryCount===1?"":"s")+"."});}
    catch(e){setNotice({type:"error",text:e.message});}finally{setBusy("");}
  };
  const retain=async()=>{
    setBusy("retain");setNotice(null);
    try{const d=await post("/incidents/retain",{...incident,...resolution});if(!d.success)throw new Error("Hindsight did not confirm retention.");setRetained(true);setNotice({type:"success",text:"Incident experience retained in Hindsight. Future recalls can learn from it."});}
    catch(e){setNotice({type:"error",text:e.message});}finally{setBusy("");}
  };
  const seed=async()=>{
    setBusy("seed");setNotice(null);
    try{await post("/incidents/seed-demo",{});setIncident(DEMO);setResult(null);setRetained(false);setNotice({type:"success",text:"Synthetic demo incident retained in Hindsight. Analyze a similar incident to demonstrate recall."});}
    catch(e){setNotice({type:"error",text:e.message});}finally{setBusy("");}
  };

  const memories=result?.recalledMemories||[];
  const ai=result?.aiAnalysis;
  return E("div",{className:"app"},E("main",{className:"shell"},
    E("header",{className:"topbar"},
      E("div",null,E("div",{className:"eyebrow"},"Persistent incident learning"),E("h1",null,"Incident Response"," ",E("br"),"Memory Agent"),E("div",{className:"subtitle"},"AI-assisted incident investigation powered by persistent memory. Hindsight remembers what your team learned from production failures so recurring incidents start with context.")),
      E("div",{className:"status"},E("span",{className:"dot"}), " Hindsight + Groq · server-side")
    ),
    notice&&E("div",{className:"notice "+notice.type},notice.text),
    E("section",{className:"grid"},
      E(Panel,{kicker:"01 · New incident",title:"Investigate a production incident"},
        E(Field,{label:"Incident title",value:incident.title,onChange:v=>setI("title",v),placeholder:"e.g. Payment API returning 503 after deployment"}),
        E(Field,{label:"Service",value:incident.service,onChange:v=>setI("service",v),placeholder:"e.g. Payment API"}),
        E(Field,{label:"Incident description",value:incident.description,onChange:v=>setI("description",v),placeholder:"Describe symptoms, timing, deployment/config changes, and impact.",textarea:true}),
        E("div",{className:"actions"},
          E(Button,{primary:true,disabled:busy==="analyze"||!incident.title||!incident.service||!incident.description,onClick:analyze},busy==="analyze"?"Analyzing…":"Analyze Incident"),
          E(Button,{disabled:!!busy,onClick:loadDemo},"Load demo incident")
        ),
        E("div",{className:"demo"},"Synthetic demo data is clearly labeled and is only stored when you click “Seed demo into Hindsight”."),
        E("div",{className:"actions",style:{marginTop:"8px"}},E(Button,{disabled:busy==="seed",onClick:seed},busy==="seed"?"Seeding…":"Seed demo into Hindsight"))
      ),
      E(Panel,{kicker:"02 · Memory",title:"Hindsight Memory",right:E("span",{className:"counter"},result?memories.length+" recalled":"waiting")},
        E("div",{className:"muted",style:{marginBottom:"13px"}},"Previous experiences recalled for this incident"),
        !result?E("div",{className:"empty"},"Run an analysis to query persistent Hindsight memory."):
        memories.length?E("div",{className:"memory-list"},memories.map(m=>E(MemoryCard,{key:m.id,memory:m}))):
        E("div",{className:"empty"},"No relevant previous incidents found.",E("br"),E("br"),"This is a real Hindsight recall result — nothing is substituted with local sample data.")
      ),
      E(Panel,{full:true,kicker:"03 · AI analysis",title:"Context-aware investigation",right:ai&&E("span",{className:"tag"},ai.model)},
        !ai?E("div",{className:"empty"},"AI analysis appears after the incident is sent through Hindsight recall and then to Groq."):
        E("div",{className:"analysis"},
          E("div",{className:"analysis-block"},E("strong",null,"Situation analysis"),E("p",null,ai.situationAnalysis)),
          E("div",{className:"analysis-block"},E("strong",null,"Likely areas to investigate"),E("p",null,(ai.investigationAreas||[]).join(" · ")||"No structured areas returned.")),
          E("div",{className:"analysis-block"},E("strong",null,"Recommended next steps"),E("p",null,(ai.nextSteps||[]).join(" · ")||"No structured next steps returned.")),
          E("div",{className:"analysis-block"},E("strong",null,"Historical context used"),E("p",null,ai.historicalContext))
        )
      ),
      E(Panel,{full:true,kicker:"04 · Learn from resolution",title:"Retain the incident experience",right:retained&&E("span",{className:"counter"},"✓ retained")},
        E("div",{className:"learn-grid"},
          E(Field,{label:"Root cause",value:resolution.rootCause,onChange:v=>setResolution(p=>({...p,rootCause:v})),placeholder:"What actually caused the incident?",textarea:true}),
          E(Field,{label:"Resolution",value:resolution.resolution,onChange:v=>setResolution(p=>({...p,resolution:v})),placeholder:"What fixed it?",textarea:true}),
          E("div",{className:"field wide"},E("label",null,"Outcome"),E("input",{className:"input",value:resolution.outcome,onChange:e=>setResolution(p=>({...p,outcome:e.target.value})),placeholder:"e.g. Payment API returned to normal operation."}))
        ),
        E("div",{className:"actions"},E(Button,{primary:true,disabled:busy==="retain"||!incident.title||!resolution.rootCause||!resolution.resolution||!resolution.outcome,onClick:retain},busy==="retain"?"Retaining…":"Retain Incident Experience")),
        retained&&E("div",{className:"notice success",style:{marginTop:"12px",marginBottom:0}},"✓ Incident experience retained in Hindsight. Submit a similar incident above to verify that this newly learned experience can be recalled.")
      ),
      E(Panel,{full:true,kicker:"05 · Learning loop",title:"How the agent learns"},E(Flow),E("div",{className:"history"},E("span",{className:"muted"},"One persona · one workflow · one value proposition: reuse previous incident knowledge."),E("span",{className:"counter"},"NO LOCAL MEMORY")))
    )
  ));
}
ReactDOM.createRoot(document.getElementById("root")).render(E(App));
