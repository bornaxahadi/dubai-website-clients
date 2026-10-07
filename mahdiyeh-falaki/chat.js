// Rule-based FAQ assistant: keyword matching over chat-kb.js. No AI, no network calls.
(function(){
  const LBL={en:"Questions? Ask the assistant",fa:"سؤالی دارید؟ از دستیار بپرسید",ar:"لديك سؤال؟ اسأل المساعد"};
  const lang=()=>(typeof L!=="undefined"&&L)||"en";
  const escH=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const DIG={"۰":0,"۱":1,"۲":2,"۳":3,"۴":4,"۵":5,"۶":6,"۷":7,"۸":8,"۹":9,"٠":0,"١":1,"٢":2,"٣":3,"٤":4,"٥":5,"٦":6,"٧":7,"٨":8,"٩":9};
  const norm=s=>String(s).toLowerCase()
    .replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ؤ/g,"و")
    .replace(/[ً-ٰٟـ]/g,"").replace(/‌/g," ")
    .replace(/[۰-۹٠-٩]/g,d=>DIG[d]).replace(/٪/g,"%")
    .replace(/[^\p{L}\p{N}%\s]/gu," ").replace(/\s+/g," ").trim();
  let KB=null, IDX=null, loading=null;
  function load(){
    if(KB) return Promise.resolve();
    if(loading) return loading;
    loading=new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="chat-kb.js";sc.onload=()=>{KB=window.MF_KB||[];
      IDX=KB.map(e=>({e,keys:[...new Set(["en","fa","ar"].flatMap(l=>(e.k[l]||[]).map(norm)).filter(Boolean))]}));res()};sc.onerror=rej;document.head.appendChild(sc)});
    return loading;
  }
  function match(q){
    const t=norm(q); if(!t) return null;
    if(/^(hi|hello|hey|hiya|good (morning|afternoon|evening))( there)?$/.test(t)) return KB.find(e=>e.id==="greeting")||null;
    const pad=" "+t+" ", toks=t.split(" ");
    let best=null, bs=0;
    for(const {e,keys} of IDX){
      // strongest single keyword decides; extra hits only break ties
      let top=0, n=0;
      for(const k of keys){
        let v=0;
        if(k.includes(" ")){ if(pad.includes(" "+k+" ")) v=2+2*k.split(" ").length; else if(t.includes(k)) v=2+k.split(" ").length; }
        else if(toks.includes(k)) v=k.length>2?3:1;
        else if(k.length>=4&&toks.some(w=>w.length>=4&&(w.startsWith(k)||k.startsWith(w)))) v=1.5;
        if(v){n++; if(v>top) top=v;}
      }
      const sc=top?top+0.3*(n-1):0;
      if(sc>bs){bs=sc;best=e}
    }
    return bs>=2?best:null;
  }
  // Answer in the script the visitor typed in when it differs from the page language
  function ansLang(q){const l=lang(), arab=/[؀-ۿ]/.test(q), latin=/[a-z]/i.test(q);
    if(arab&&l==="en") return /[پچژگ]/.test(q)||!/[ةىؤإأ]/.test(q)?"fa":"ar";
    if(latin&&!arab&&l!=="en") return "en"; return l;}

  const css=`.mfc-btn{position:fixed;inset-inline-end:18px;bottom:86px;z-index:40;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:#1E1E1E;color:#C9A46A;box-shadow:0 10px 28px rgba(0,0,0,.25);display:grid;place-items:center;transition:transform .2s}
.mfc-btn:hover{transform:translateY(-2px)}.mfc-btn svg{width:26px;height:26px}
.mfc-btn::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #C9A46A;opacity:0;animation:mfcRing 2.4s ease-out 2s 2}
@keyframes mfcRing{0%{opacity:.8;transform:scale(.9)}100%{opacity:0;transform:scale(1.25)}}
@media (min-width:900px){.mfc-btn{bottom:24px}}
.mfc{position:fixed;inset-inline-end:18px;bottom:86px;z-index:41;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 120px));background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:22px;box-shadow:0 24px 60px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden}
@media (min-width:900px){.mfc{bottom:24px}}
@media (max-width:420px){.mfc{inset-inline:12px;width:auto}}
.mfc[hidden],.mfc-btn[hidden]{display:none}
.mfc-h{display:flex;align-items:center;gap:10px;padding:14px 14px 14px 16px;background:#1E1E1E;color:#F6F4F0}
.mfc-h .mk{width:32px;height:32px;flex:none}.mfc-h .mk .tile{stroke:#C9A46A;stroke-opacity:.5;stroke-width:1}
.mfc-h b{display:block;font-size:14.5px}.mfc-h small{display:block;font-size:11.5px;color:#BDB8AF}
.mfc-h button{margin-inline-start:auto;background:none;border:0;color:#F6F4F0;cursor:pointer;font-size:22px;line-height:1;padding:4px 8px;border-radius:8px}
.mfc-h button:hover{background:#ffffff1a}
.mfc-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg)}
.mfc-q,.mfc-a{max-width:86%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.55;white-space:pre-line}
.mfc-q{align-self:flex-end;background:#1E1E1E;color:#F6F4F0;border-end-end-radius:5px}
.mfc-a{align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-end-start-radius:5px}
.mfc-a .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mfc-a .acts a{font-size:12.5px;font-weight:700;text-decoration:none;padding:6px 11px;border-radius:99px;border:1px solid var(--gold);color:var(--gold)}
.mfc-a .acts a.w{background:#25D366;border-color:#25D366;color:#fff}
.mfc-c{display:flex;gap:6px;overflow-x:auto;padding:10px 14px 0;scrollbar-width:none}
.mfc-c button{flex:none;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:99px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer}
.mfc-c button:hover{border-color:var(--gold);color:var(--gold)}
.mfc-f{display:flex;gap:8px;padding:10px 14px 6px}
.mfc-f input{flex:1;min-width:0;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:99px;padding:10px 14px;font:inherit;font-size:14px}
.mfc-f input:focus{outline:2px solid var(--gold);outline-offset:1px}
.mfc-f button{border:0;border-radius:99px;background:var(--gold);color:#fff;font:inherit;font-weight:700;font-size:13.5px;padding:0 16px;cursor:pointer}
.mfc-n{font-size:11px;color:var(--muted);text-align:center;padding:0 14px 10px}
@media (prefers-reduced-motion:reduce){.mfc-btn::after{animation:none}.mfc-btn:hover{transform:none}}`;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 8.5h7M8.5 11.5h4.5" stroke-linecap="round"/></svg>';
  const btn=document.createElement("button"); btn.type="button"; btn.className="mfc-btn"; btn.innerHTML=ICON;
  const panel=document.createElement("section"); panel.className="mfc"; panel.hidden=true; panel.setAttribute("role","dialog");
  document.body.append(btn,panel);
  const setLabels=()=>{btn.setAttribute("aria-label",LBL[lang()]);btn.title=LBL[lang()]};
  setLabels();

  let built=false, msgs, chips;
  const UI=()=>window.MF_KB_UI[lang()]||window.MF_KB_UI.en;
  function shell(){
    const u=UI();
    panel.setAttribute("aria-label",u.title); panel.dir=lang()==="en"?"ltr":"rtl"; panel.lang=lang();
    panel.innerHTML=`<div class="mfc-h">${typeof MARK!=="undefined"?MARK:""}<div><b>${escH(u.title)}</b><small>Mahdiyeh Falaki · BRN 93322</small></div><button type="button" class="mfc-x" aria-label="Close">×</button></div>
<div class="mfc-m" aria-live="polite"></div><div class="mfc-c"></div>
<form class="mfc-f"><input type="text" maxlength="300" autocomplete="off" aria-label="${escH(u.ph)}" placeholder="${escH(u.ph)}"><button type="submit">${escH(u.send)}</button></form><div class="mfc-n">${escH(u.note)}</div>`;
    msgs=panel.querySelector(".mfc-m"); chips=panel.querySelector(".mfc-c");
    chips.innerHTML=u.chips.map(c=>`<button type="button">${escH(c)}</button>`).join("");
    chips.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>ask(b.textContent)));
    panel.querySelector(".mfc-x").addEventListener("click",close);
    panel.querySelector(".mfc-f").addEventListener("submit",e=>{e.preventDefault();const i=e.target.querySelector("input");const v=i.value.trim();if(v){ask(v);i.value=""}});
    bot(u.hello,null,false);
    built=true;
  }
  function bot(text,go,waBtn,l,q){
    const u=window.MF_KB_UI[l||lang()]||UI(), d=document.createElement("div"); d.className="mfc-a";
    let acts="";
    if(go) acts+=`<a href="${escH(go)}" data-close>${escH(u.open)}</a>`;
    if(waBtn&&typeof wa==="function") acts+=`<a class="w" href="${escH(wa(q?("Hi Mahdiyeh, "+q):t("wa_general")))}" target="_blank" rel="noopener">${escH(u.wa)}</a>`;
    d.innerHTML=escH(text)+(acts?`<div class="acts">${acts}</div>`:"");
    d.querySelectorAll("[data-close]").forEach(a=>a.addEventListener("click",close));
    msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
  }
  function ask(q){
    const d=document.createElement("div"); d.className="mfc-q"; d.textContent=q; msgs.appendChild(d);
    const e=match(q), l=ansLang(q);
    setTimeout(()=>{ if(e) bot(e.a[l]||e.a.en,e.go,e.id==="contact"||e.id==="viewing",l);
      else bot((window.MF_KB_UI[l]||UI()).nomatch,null,true,l,q); },250);
  }
  function open(){load().then(()=>{if(!built||panel.lang!==lang())shell();panel.hidden=false;btn.hidden=true;panel.querySelector("input").focus()}).catch(()=>{window.open(wa(t("wa_general")),"_blank","noopener")})}
  function close(){panel.hidden=true;btn.hidden=false;btn.focus()}
  btn.addEventListener("click",open);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
  // keep labels in step with the site language switcher
  document.addEventListener("click",e=>{if(e.target.closest("[data-lang]"))setTimeout(()=>{setLabels();if(built&&!panel.hidden)shell();else built=false},0)});
  window.MF_CHAT={match:q=>{const e=IDX&&match(q);return e?e.id:null},load};
})();
