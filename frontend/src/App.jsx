import { useState, useRef } from "react";

// Railway'da deploy qilgandan keyin shu URL'ni o'zgartiring
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TABS = [
  { id:"bemor", label:"Bemor", icon:"M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" },
  { id:"xuruj", label:"Xuruj", icon:"M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { id:"eeg",   label:"EEG",   icon:"M22 12h-4l-3 9L9 3l-3 9H2" },
  { id:"mrt",   label:"MRT",   icon:"M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 3a7 7 0 1 1 0 14A7 7 0 0 1 12 5zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" },
  { id:"sindrom",label:"Sindrom",icon:"M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" },
  { id:"dori",  label:"Dori",  icon:"M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" },
];

const eegPatterns = ["Generalized spike-wave","Centrotemporal spike","Hypsarrhythmia","Polyspike-wave","Fokal temporal spike","Fokal frontal spike","Normal EEG"];
const mrtFindings = ["Kortikal displaziya","Gipokampal skleroz","Tuberoz skleroz","Gemimegalensefaliya","O'sma","Periventrikulyar leykomalatsiya","Normal MRT"];
const redFlags   = ["Birinchi hayot yilida boshlangan","Status epileptikus","Rivojlanish regressi","Dori rezistentligi","MRT patologiyasi"];
const dorilor    = {
  "Absans":["Valproat","Etosuksimid","Lamotrigin"],
  "Fokal":["Levetirasetam","Lamotrigin","Okskarbazepin","Karbamazepin"],
  "Generalizatsiyalashgan":["Valproat","Levetirasetam","Lamotrigin"],
  "Miokloniya":["Valproat","Klonazepam","Levetirasetam"],
};

// ─── tiny style helpers ────────────────────────────────────────────
const S = {
  wrap:{fontFamily:"'Inter',system-ui,sans-serif",maxWidth:740,margin:"0 auto",paddingBottom:48,background:"#f8f9fb",minHeight:"100vh"},
  header:{background:"#1e2433",padding:"28px 28px 22px",position:"relative",overflow:"hidden"},
  htitle:{fontSize:22,fontWeight:700,color:"#f1f5f9",letterSpacing:-0.3,position:"relative"},
  hsub:{fontSize:13,color:"#94a3b8",marginTop:4,position:"relative",letterSpacing:0.2},
  badge:{display:"inline-flex",alignItems:"center",gap:5,marginTop:10,padding:"4px 10px",background:"rgba(99,102,241,0.2)",borderRadius:20,fontSize:11,color:"#a5b4fc",fontWeight:600,letterSpacing:0.5,position:"relative"},
  tabBar:{background:"#fff",borderBottom:"1px solid #e8eaf0",padding:"0 20px",display:"flex",gap:2,overflowX:"auto"},
  tab:(a,d)=>({display:"flex",alignItems:"center",gap:6,padding:"14px 16px",border:"none",background:"none",color:a?"#4f46e5":d?"#22c55e":"#64748b",borderBottom:a?"2px solid #4f46e5":d?"2px solid #22c55e":"2px solid transparent",cursor:"pointer",fontSize:13,fontWeight:a||d?600:400,whiteSpace:"nowrap",transition:"all .2s",marginBottom:-1,flexShrink:0}),
  body:{padding:"24px 24px 0"},
  card:{background:"#fff",borderRadius:14,border:"1px solid #e8eaf0",padding:"20px 22px",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,.04)"},
  secLabel:{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10},
  chip:(on,danger)=>({padding:"7px 14px",borderRadius:8,border:on?(danger?"1.5px solid #ef4444":"1.5px solid #4f46e5"):"1px solid #e2e8f0",background:on?(danger?"#fef2f2":"#eef2ff"):"#fafafa",color:on?(danger?"#dc2626":"#4338ca"):"#475569",cursor:"pointer",fontSize:13,fontWeight:on?600:400,transition:"all .15s"}),
  inputWrap:{marginBottom:14},
  label:{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5,letterSpacing:.2},
  input:{width:"100%",padding:"10px 13px",borderRadius:9,border:"1px solid #e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fafafa",color:"#1e293b"},
  textarea:{width:"100%",minHeight:90,padding:"10px 13px",borderRadius:9,border:"1px solid #e2e8f0",fontSize:14,resize:"vertical",boxSizing:"border-box",outline:"none",background:"#fafafa",color:"#1e293b",lineHeight:1.6},
  btnPrimary:{padding:"11px 26px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"},
  btnGhost:{padding:"11px 22px",background:"#fff",color:"#4f46e5",border:"1px solid #c7d2fe",borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer"},
  navRow:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,paddingTop:16,borderTop:"1px solid #f1f5f9"},
  successBox:{padding:"10px 14px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,fontSize:13,color:"#15803d",display:"flex",alignItems:"center",gap:6,marginTop:4},
  warnBox:{padding:"12px 16px",background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:9,fontSize:13,color:"#9a3412",marginTop:4},
  dangerBox:{padding:"12px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,fontSize:13,color:"#dc2626",marginTop:4},
};

// ─── reusable components ───────────────────────────────────────────
function CheckGroup({options,selected,onChange,danger=false}){
  return <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{options.map(opt=>{
    const on=selected.includes(opt);
    return <button key={opt} onClick={()=>onChange(on?selected.filter(x=>x!==opt):[...selected,opt])} style={S.chip(on,danger&&on)}>{opt}</button>;
  })}</div>;
}
function RadioGroup({options,selected,onChange}){
  return <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{options.map(opt=>{
    const on=selected===opt;
    return <button key={opt} onClick={()=>onChange(opt)} style={S.chip(on,false)}>{opt}</button>;
  })}</div>;
}
function Field({label,value,onChange,type="text",placeholder=""}){
  return <div style={S.inputWrap}>
    <label style={S.label}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input}
      onFocus={e=>e.target.style.border="1px solid #818cf8"} onBlur={e=>e.target.style.border="1px solid #e2e8f0"}/>
  </div>;
}
function Sec({title,children,noBorder=false}){
  return <div style={{marginBottom:20}}>
    <div style={S.secLabel}>{title}</div>
    {children}
    {!noBorder&&<div style={{height:1,background:"#f1f5f9",marginTop:18}}/>}
  </div>;
}

function FileUploader({label,files,onChange,onExtract}){
  const [analyzing,setAnalyzing]=useState(false);
  const ref=useRef(null);
  const toB64=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});

  const handle=async(newFiles)=>{
    const list=Array.from(newFiles).filter(f=>f.type==="application/pdf"||f.type.startsWith("image/"));
    if(!list.length)return;
    onChange(prev=>[...prev,...list.map(f=>({name:f.name,type:f.type,status:"yuklandi"}))]);
    setAnalyzing(true);
    for(const f of list){
      try{
        const b64=await toB64(f);
        const res=await fetch(`${API_URL}/api/analyze-file`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({base64_data:b64,media_type:f.type,label})
        });
        const data=await res.json();
        onExtract(`[${f.name}]: ${data.result}`);
        onChange(prev=>prev.map(p=>p.name===f.name?{...p,status:"tahlil qilindi"}:p));
      }catch(e){
        onChange(prev=>prev.map(p=>p.name===f.name?{...p,status:"xato"}:p));
      }
    }
    setAnalyzing(false);
  };

  const [drag,setDrag]=useState(false);
  return <div>
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files);}} onClick={()=>ref.current.click()}
      style={{border:`2px dashed ${drag?"#818cf8":"#d1d5db"}`,borderRadius:12,padding:"22px 16px",textAlign:"center",cursor:"pointer",background:drag?"#eef2ff":"#fafafa",transition:"all .2s"}}>
      <input ref={ref} type="file" multiple accept=".pdf,image/*" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      <div style={{fontSize:26,marginBottom:6}}>📎</div>
      <div style={{fontSize:13,color:"#64748b",fontWeight:500}}>PDF, JPG yoki PNG yuklang</div>
      <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Bosing yoki bu yerga suring</div>
    </div>
    {analyzing&&<div style={{marginTop:8,fontSize:13,color:"#6366f1"}}>⏳ Fayl tahlil qilinmoqda...</div>}
    {files.length>0&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
      {files.map((f,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#fff",border:"1px solid #e8eaf0",borderRadius:9}}>
          <span>{f.type==="application/pdf"?"📄":"🖼️"}</span>
          <span style={{fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#334155"}}>{f.name}</span>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600,
            background:f.status==="tahlil qilindi"?"#dcfce7":f.status==="xato"?"#fee2e2":"#fef9c3",
            color:f.status==="tahlil qilindi"?"#15803d":f.status==="xato"?"#dc2626":"#92400e"}}>
            {f.status==="tahlil qilindi"?"✓ Tahlil":f.status==="xato"?"✗ Xato":"⏳"}
          </span>
          <button onClick={e=>{e.stopPropagation();onChange(prev=>prev.filter(p=>p.name!==f.name));}}
            style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:18,lineHeight:1}}>×</button>
        </div>
      ))}
    </div>}
  </div>;
}

// ─── main app ─────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("bemor");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);

  const [yosh,setYosh]=useState("");const [jins,setJins]=useState("");const [vazn,setVazn]=useState("");
  const [birinchi,setBirinchi]=useState("");const [homiladorlik,setHomiladorlik]=useState("");const [oila,setOila]=useState("");
  const [boshlanish,setBoshlanish]=useState([]);const [aura,setAura]=useState([]);const [paytida,setPaytida]=useState([]);
  const [davom,setDavom]=useState("");const [postiktal,setPostiktal]=useState([]);const [flags,setFlags]=useState([]);
  const [eegP,setEegP]=useState([]);const [eegText,setEegText]=useState("");const [eegFiles,setEegFiles]=useState([]);
  const [mrtF,setMrtF]=useState([]);const [mrtText,setMrtText]=useState("");const [mrtFiles,setMrtFiles]=useState([]);
  const [sindromNotes,setSindromNotes]=useState("");const [doriNotes,setDoriNotes]=useState("");

  const isOk=id=>{
    if(id==="bemor")return !!(yosh&&jins);
    if(id==="xuruj")return boshlanish.length>0&&paytida.length>0&&!!davom;
    if(id==="eeg")return eegP.length>0;
    if(id==="mrt")return mrtF.length>0;
    return true;
  };
  const core=["bemor","xuruj","eeg","mrt"];
  const completed=TABS.map(t=>t.id).filter(id=>isOk(id));
  const allReady=core.every(id=>isOk(id));
  const doneCount=core.filter(id=>isOk(id)).length;

  const buildPrompt=()=>`Siz pediatrik nevrologiya mutaxassisi AI yordamchisiz. ILAE 2022 bo'yicha baholang.
BEMOR: Yosh=${yosh}, Jins=${jins}, Vazn=${vazn||"?"}kg, Birinchi xuruj=${birinchi||"?"}, Homiladorlik=${homiladorlik||"yo'q"}, Oila=${oila||"yo'q"}
XURUJ: Boshlanish=[${boshlanish.join(",")}], Aura=[${aura.join(",")||"yo'q"}], Payti=[${paytida.join(",")}], Davom=${davom}, Postiktal=[${postiktal.join(",")||"yo'q"}]
QIZIL BAYROQ: ${flags.join(",")||"yo'q"}
EEG: [${eegP.join(",")}] ${eegText}
MRT: [${mrtF.join(",")}] ${mrtText}
ESLATMA: ${sindromNotes||"yo'q"}
Faqat JSON (boshqa matn yo'q):
{"xurujTuri":"...","sindromlar":[{"nom":"...","ehtimol":85,"izoh":"..."}],"differensial":[{"nom":"...","ehtimol":15,"sabab":"..."}],"doriTavsiya":[{"nomi":"...","doza":"...","izoh":"..."}],"xulosa":"...","ogohlantrish":"..."}`;

  const analyze=async()=>{
    setLoading(true);setResult(null);setTab("sindrom");
    try{
      const res=await fetch(`${API_URL}/api/analyze`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt:buildPrompt()})
      });
      const data=await res.json();
      setResult(JSON.parse(data.result.replace(/```json|```/g,"").trim()));
    }catch(e){alert("Xato: "+e.message);}
    setLoading(false);
  };

  const pColor=n=>{
    if(n>=70)return{bg:"#f0fdf4",border:"#bbf7d0",bar:"#22c55e",badge:"#dcfce7",badgeTxt:"#15803d"};
    if(n>=30)return{bg:"#fffbeb",border:"#fde68a",bar:"#f59e0b",badge:"#fef9c3",badgeTxt:"#92400e"};
    return{bg:"#fff1f2",border:"#fecdd3",bar:"#f43f5e",badge:"#fee2e2",badgeTxt:"#be123c"};
  };

  return(
    <div style={S.wrap}>
      <style>{`*{box-sizing:border-box}button:hover{opacity:.88}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* header */}
      <div style={S.header}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(99,102,241,.12)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3z"/>
            </svg>
          </div>
          <div>
            <div style={S.htitle}>AI Epilepsy Diagnostic Assistant</div>
            <div style={S.hsub}>Shifokorlar uchun · ILAE 2022 · O'zbek tili</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,position:"relative"}}>
          {["ILAE 2022","Multimodal AI","Pediatrik Nevrologiya"].map(b=><div key={b} style={S.badge}>{b}</div>)}
        </div>
      </div>

      {/* progress */}
      <div style={{background:"#fff",padding:"12px 24px",borderBottom:"1px solid #e8eaf0",display:"flex",alignItems:"center",gap:12}}>
        <div style={{flex:1,height:5,background:"#f1f5f9",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${doneCount/4*100}%`,background:"linear-gradient(90deg,#4f46e5,#7c3aed)",borderRadius:10,transition:"width .4s"}}/>
        </div>
        <span style={{fontSize:12,color:"#64748b",fontWeight:600,whiteSpace:"nowrap"}}>{doneCount}/4 modul</span>
        {allReady&&<span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>✓ Tayyor</span>}
      </div>

      {/* tabs */}
      <div style={S.tabBar}>
        {TABS.map(t=>{
          const done=completed.includes(t.id)&&t.id!=="sindrom"&&t.id!=="dori";
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)} style={S.tab(active,done)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={t.icon}/></svg>
              {t.label}
              {done&&<span style={{width:6,height:6,borderRadius:3,background:"#22c55e",display:"inline-block"}}/>}
            </button>
          );
        })}
      </div>

      <div style={S.body}>

        {/* BEMOR */}
        {tab==="bemor"&&<div>
          <div style={S.card}>
            <Sec title="Asosiy ma'lumotlar">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Field label="Yosh (yil) *" value={yosh} onChange={setYosh} type="number" placeholder="masalan: 8"/>
                <Field label="Vazn (kg)" value={vazn} onChange={setVazn} type="number" placeholder="masalan: 25"/>
              </div>
              <div style={S.inputWrap}>
                <label style={S.label}>Jins *</label>
                <RadioGroup options={["Erkak","Ayol"]} selected={jins} onChange={setJins}/>
              </div>
              <Field label="Birinchi xuruj yoshi" value={birinchi} onChange={setBirinchi} placeholder="masalan: 6 yosh"/>
            </Sec>
            <Sec title="Anamnez" noBorder>
              <Field label="Homiladorlik va tug'ruq" value={homiladorlik} onChange={setHomiladorlik} placeholder="masalan: muddatidan oldin tug'ilgan..."/>
              <Field label="Oilaviy anamnez" value={oila} onChange={setOila} placeholder="masalan: onasida epilepsiya bor..."/>
            </Sec>
          </div>
          {isOk("bemor")&&<div style={S.successBox}>✓ Bemor ma'lumotlari to'ldirildi</div>}
          <div style={S.navRow}><div/><button style={S.btnPrimary} onClick={()=>setTab("xuruj")}>Keyingi: Xuruj →</button></div>
        </div>}

        {/* XURUJ */}
        {tab==="xuruj"&&<div>
          <div style={S.card}>
            <Sec title="Xuruj boshlanishi *"><CheckGroup options={["Uxlayotganda","Uyg'oqlikda","Isitma fonida","Yorug'lik ta'sirida","Stressdan keyin"]} selected={boshlanish} onChange={setBoshlanish}/></Sec>
            <Sec title="Aura"><CheckGroup options={["Qo'rquv hissi","Qorin ko'tarilishi","Hid sezish","Ko'rish buzilishi","Yo'q"]} selected={aura} onChange={setAura}/></Sec>
            <Sec title="Xuruj payti *"><CheckGroup options={["Hush yo'qolgan","Hush saqlangan","Ko'z chapga/o'ngga","Bosh burilgan","Bir qo'ldan boshlangan","Ikkala tomondan","Avtomatizmlar","Miokloniya","Absans"]} selected={paytida} onChange={setPaytida}/></Sec>
            <Sec title="Davomiyligi *"><RadioGroup options={["<30 soniya","30–60 soniya","1–5 daqiqa",">5 daqiqa"]} selected={davom} onChange={setDavom}/></Sec>
            <Sec title="Postiktal davr"><CheckGroup options={["Uyquchanlik","Todd parezi","Adashish","Normal"]} selected={postiktal} onChange={setPostiktal}/></Sec>
            <Sec title="Qizil bayroqlar" noBorder>
              <CheckGroup options={redFlags} selected={flags} onChange={setFlags} danger/>
              {flags.length>0&&<div style={{...S.dangerBox,marginTop:10}}>⚠️ Epileptolog konsultatsiyasi zarur!</div>}
            </Sec>
          </div>
          {isOk("xuruj")&&<div style={S.successBox}>✓ Xuruj ma'lumotlari to'ldirildi</div>}
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={()=>setTab("bemor")}>← Orqaga</button>
            <button style={S.btnPrimary} onClick={()=>setTab("eeg")}>Keyingi: EEG →</button>
          </div>
        </div>}

        {/* EEG */}
        {tab==="eeg"&&<div>
          <div style={S.card}>
            <Sec title="EEG naqshlari *"><CheckGroup options={eegPatterns} selected={eegP} onChange={setEegP}/></Sec>
            <Sec title="EEG xulosasi matni"><textarea value={eegText} onChange={e=>setEegText(e.target.value)} placeholder="EEG xulosa matnini kiriting..." style={S.textarea}/></Sec>
            <Sec title="EEG fayl yuklash — PDF / JPG / PNG" noBorder>
              <FileUploader label="EEG" files={eegFiles} onChange={setEegFiles} onExtract={t=>setEegText(p=>p?p+"\n"+t:t)}/>
            </Sec>
          </div>
          {isOk("eeg")&&<div style={S.successBox}>✓ EEG ma'lumotlari to'ldirildi</div>}
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={()=>setTab("xuruj")}>← Orqaga</button>
            <button style={S.btnPrimary} onClick={()=>setTab("mrt")}>Keyingi: MRT →</button>
          </div>
        </div>}

        {/* MRT */}
        {tab==="mrt"&&<div>
          <div style={S.card}>
            <Sec title="MRT topilmalari *"><CheckGroup options={mrtFindings} selected={mrtF} onChange={setMrtF}/></Sec>
            <Sec title="MRT xulosasi matni"><textarea value={mrtText} onChange={e=>setMrtText(e.target.value)} placeholder="MRT xulosa matnini kiriting..." style={S.textarea}/></Sec>
            <Sec title="MRT fayl yuklash — PDF / JPG / PNG" noBorder>
              <FileUploader label="MRT" files={mrtFiles} onChange={setMrtFiles} onExtract={t=>setMrtText(p=>p?p+"\n"+t:t)}/>
            </Sec>
          </div>
          {isOk("mrt")&&<div style={S.successBox}>✓ MRT ma'lumotlari to'ldirildi</div>}
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={()=>setTab("eeg")}>← Orqaga</button>
            <button style={S.btnPrimary} onClick={()=>setTab("sindrom")}>Keyingi: Sindrom →</button>
          </div>
        </div>}

        {/* SINDROM */}
        {tab==="sindrom"&&<div>
          <div style={S.card}>
            <Sec title="Qo'shimcha klinik eslatmalar" noBorder>
              <textarea value={sindromNotes} onChange={e=>setSindromNotes(e.target.value)} placeholder="Nevrologik status, genetik test, oldingi dori tarixi..." style={S.textarea}/>
            </Sec>
          </div>
          {!allReady&&<div style={{...S.warnBox,marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:10}}>⚠️ To'ldirilmagan modullar:</div>
            {core.filter(id=>!isOk(id)).map(id=>(
              <div key={id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,padding:"8px 12px",background:"#fff",borderRadius:8,border:"1px solid #fed7aa"}}>
                <span style={{fontSize:13}}>{TABS.find(t=>t.id===id)?.label} moduli to'ldirilmagan</span>
                <button onClick={()=>setTab(id)} style={{padding:"4px 12px",background:"#f97316",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>To'ldirish →</button>
              </div>
            ))}
          </div>}
          {allReady&&!result&&!loading&&<div style={{textAlign:"center",padding:"40px 24px",background:"#fff",borderRadius:14,border:"1px solid #e8eaf0",marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:20,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3z"/>
              </svg>
            </div>
            <div style={{fontSize:17,fontWeight:700,color:"#1e293b",marginBottom:6}}>Barcha 4 modul to'ldirildi</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:24}}>AI multimodal tahlil: Anamnez + EEG + MRT · ILAE 2022</div>
            <button onClick={analyze} style={{padding:"13px 36px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>Tahlilni Boshlash →</button>
          </div>}
          {loading&&<div style={{textAlign:"center",padding:"56px 24px",background:"#fff",borderRadius:14,border:"1px solid #e8eaf0",marginBottom:16}}>
            <div style={{width:52,height:52,border:"3px solid #e0e7ff",borderTopColor:"#4f46e5",borderRadius:"50%",margin:"0 auto 20px",animation:"spin .9s linear infinite"}}/>
            <div style={{fontSize:16,fontWeight:600,color:"#4f46e5"}}>AI tahlil qilmoqda...</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:6}}>Anamnez · EEG · MRT · ILAE 2022</div>
          </div>}
          {result&&<div>
            <div style={{padding:"14px 18px",background:"#eef2ff",borderRadius:12,marginBottom:16,display:"flex",alignItems:"center",gap:12,border:"1px solid #c7d2fe"}}>
              <div style={{width:36,height:36,borderRadius:9,background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6366f1",fontWeight:700,letterSpacing:1}}>ILAE 2022 — XURUJ TURI</div>
                <div style={{fontSize:16,fontWeight:700,color:"#3730a3"}}>{result.xurujTuri}</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.secLabel}>Epileptik sindromlar — ehtimollik</div>
              {result.sindromlar?.map((s,i)=>{
                const c=pColor(s.ehtimol);
                return <div key={i} style={{padding:"13px 14px",background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{s.nom}</div>
                    <div style={{padding:"4px 12px",borderRadius:20,background:c.badge,color:c.badgeTxt,fontSize:13,fontWeight:700}}>{s.ehtimol}%</div>
                  </div>
                  <div style={{height:5,background:"rgba(0,0,0,.06)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${s.ehtimol}%`,background:c.bar,borderRadius:3}}/>
                  </div>
                  {s.izoh&&<div style={{fontSize:13,color:"#475569",marginTop:7,lineHeight:1.5}}>{s.izoh}</div>}
                </div>;
              })}
            </div>
            {result.differensial?.length>0&&<div style={S.card}>
              <div style={S.secLabel}>Differensial diagnostika</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {result.differensial.map((d,i)=>(
                  <div key={i} style={{padding:"10px 12px",background:"#f8f9fb",border:"1px solid #e8eaf0",borderRadius:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#334155"}}>{d.nom}</span>
                      <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>{d.ehtimol}%</span>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>{d.sabab}</div>
                  </div>
                ))}
              </div>
            </div>}
            {result.xulosa&&<div style={{padding:"14px 16px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,marginBottom:10,fontSize:14,color:"#166534",lineHeight:1.7}}>
              <div style={{fontWeight:700,marginBottom:5,fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>Klinik Xulosa</div>
              {result.xulosa}
            </div>}
            {result.ogohlantrish&&<div style={{...S.dangerBox,marginBottom:16}}>⚠️ {result.ogohlantrish}</div>}
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button onClick={()=>setResult(null)} style={{...S.btnGhost,flex:1}}>Qayta tahlil</button>
              <button onClick={()=>setTab("dori")} style={{...S.btnPrimary,flex:1}}>Dori tavsiyasi →</button>
            </div>
          </div>}
        </div>}

        {/* DORI */}
        {tab==="dori"&&<div>
          {result?.doriTavsiya?.length>0&&<div style={S.card}>
            <div style={S.secLabel}>AI tavsiya etgan dorilar</div>
            {result.doriTavsiya.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,marginBottom:8}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#15803d"}}>{d.nomi}</div>
                  {d.izoh&&<div style={{fontSize:12,color:"#4ade80",marginTop:2}}>{d.izoh}</div>}
                </div>
                <div style={{padding:"5px 13px",background:"#dcfce7",color:"#15803d",borderRadius:20,fontSize:13,fontWeight:600}}>{d.doza}</div>
              </div>
            ))}
          </div>}
          <div style={S.card}>
            <div style={S.secLabel}>Xuruj turiga ko'ra ma'lumotnoma</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {Object.entries(dorilor).map(([tur,list])=>(
                <div key={tur} style={{padding:"13px 14px",background:"#fafafa",border:"1px solid #e8eaf0",borderRadius:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#4338ca",marginBottom:9}}>{tur}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {list.map(d=><span key={d} style={{padding:"4px 10px",background:"#eef2ff",color:"#3730a3",borderRadius:16,fontSize:12,fontWeight:500}}>{d}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.secLabel}>Dori bo'yicha eslatmalar</div>
            <textarea value={doriNotes} onChange={e=>setDoriNotes(e.target.value)} placeholder="Allergyalar, oldingi dorilar..." style={S.textarea}/>
          </div>
          {!result&&<div style={{...S.warnBox,marginBottom:16}}>💡 Sindrom tahlilidan so'ng AI dori tavsiyalarini ko'rasiz</div>}
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={()=>setTab("sindrom")}>← Sindromga qaytish</button>
          </div>
        </div>}

      </div>
    </div>
  );
}
