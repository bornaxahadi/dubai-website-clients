/* TankMates content moderation engine: finds offensive words, insults, slurs and threats
   in English, Persian (Farsi + Finglish) and Arabic (script + Arabizi). Used to mask text
   everywhere it is displayed and to block / clean what people type. The server will run
   the same list (supabase/schema.sql) once accounts go live. */
(function(){
'use strict';
/* leet-speak aware letter classes */
const L={a:'a@4*àáâä',b:'b8',c:'ck(*',d:'d',e:'e3*èéê',f:'f',g:'g9',h:'h',i:'i1!|*lìíî',j:'j',k:'kq',l:'l1|!',m:'m',n:'n',o:'o0*òóôö',p:'p',q:'q',r:'r',s:'s$5z*',t:'t7+',u:'u*vùúûü',v:'v',w:'w',x:'x',y:'y',z:'z'};
const cls=ch=>{const s=L[ch];if(!s)return ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return '['+s.replace(/[\]\\^-]/g,'\\$&')+']'};
/* sep: allow f.u.c.k / f u c k ; sfx: allow any ending (fucking, shitty) ; plain words allow common endings only */
function latin(root,{sep=false,sfx=false}={}){const letters=[...root];const j=sep?'[\\s._\\-]?':'';
 const body=letters.map((c,k)=>c===' '?'[\\s._\\-]*':cls(c)+'+'+(k<letters.length-1&&letters[k+1]!==' '?j:'')).join('');
 return body+(sfx?'[a-z]*':'(?:s|es|z|ed|ing|in|er|ers|y)?')}
/* sev: 1 insult / slang, 2 profanity / sexual, 3 slur / hate / threat */
const E=[];const add=(sev,src,tag)=>E.push({sev,src,tag});
/* English profanity */
[['fuck',1,1],['fck',0,1],['fuk',0,1],['fuq',0,1],['phuck',0,1],['shit',1,1],['sh1t',0,1],['bitch',1,1],['biatch',0,1],['cunt',1,1],['motherfuck',1,1],['mofo',0,0],['asshole',1,1],['arsehole',1,1],['dickhead',1,1],['bastard',0,0],['whore',1,1],['slut',1,1],['wanker',0,0],['wank',0,1],['twat',0,0],['bollocks',0,0],['bullshit',1,1],['jackass',0,0],['dumbass',0,0],['smartass',0,0],['pussy',0,0],['pussies',0,0],['dildo',0,0],['blowjob',0,0],['handjob',0,0],['cumshot',0,0],['jizz',0,0],['porn',0,1],['horny',0,0],['tits',0,0],['titties',0,0],['boobs',0,0],['damn',0,0],['goddamn',0,0],['crap',0,0],['piss',0,1],['prick',0,0],['douche',0,1],['skank',0,0],['hoe',0,0],['thot',0,0],['nude',0,0],['nudes',0,0],['sexy',0,0],['wtf',0,0],['stfu',0,0],['gtfo',0,0],['fml',0,0],['omfg',0,0],['milf',0,0]]
 .forEach(([w,sep,sfx])=>add(['damn','crap','wtf','fml','omfg','sexy','piss','hoe','prick','douche','horny','nude','nudes','boobs'].includes(w)?1:2,latin(w,{sep:!!sep,sfx:!!sfx}),w));
['ass','arse','dick','cock','cum','fag','fags'].forEach(w=>add(2,latin(w),w));
/* insults (stand-alone) */
['idiot','idiots','moron','morons','imbecile','loser','losers','dumbo','stupid','retard','retarded','cretin','scumbag','jerk','pig','dog','trash','garbage','clown','noob','nerd','freak','ugly','fatso','lame','sucker'].forEach(w=>{const strong=['idiot','idiots','moron','morons','imbecile','retard','retarded','cretin','scumbag','fatso'].includes(w);
 if(strong)add(w.startsWith('retard')?3:1,latin(w),w)});
/* insults aimed at someone: "you are stupid", "ur so dumb", "u r a loser" */
add(1,'(?:you|u|ya|ur|youre|you\'re|your|yall|y\'all)(?:\\s+(?:are|r|re|is))?(?:\\s+(?:so|such|very|really|a|an|the|total|complete|fucking|freaking|big|little))*\\s+(?:stupid|dumb|idiot|moron|loser|ugly|trash|garbage|pathetic|clown|noob|fool|joke|disgusting|useless|worthless|pig|dog|rat|retard|freak|nerd|lame|sucker)s?','you-insult');
add(1,'shut\\s*(?:the\\s+\\w+\\s+)?up','shut up');add(1,'get\\s+lost','get lost');add(1,'go\\s+to\\s+hell','go to hell');add(1,'suck\\s+my','suck my');add(1,'(?:you|u)\\s+suck','you suck');add(1,'screw\\s+(?:you|u)','screw you');add(1,'piss\\s+off','piss off');
/* threats / self-harm baiting */
add(3,'kill\\s+(?:yo)?u?r?\\s*self|kill\\s+yourself|kys|go\\s+die|die\\s+in\\s+a\\s+fire|i\\s*(?:\'ll|will|wil|am\\s+going\\s+to|gonna)\\s+(?:kill|hurt|stab|shoot|find)\\s+(?:you|u)|hope\\s+(?:you|u)\\s+die','threat');
/* slurs */
['nigger','nigga','niggas','nigg','faggot','fagot','tranny','kike','spic','chink','wetback','raghead','towelhead','coon','paki','gook','dyke'].forEach(w=>add(3,latin(w,{sep:w.length>4,sfx:['nigg','faggot','nigger'].includes(w)}),w));
/* Persian in Latin letters (Finglish) */
['kos','koskesh','koskhol','kosnane','kos nane','kos kesh','kir','kiri','kiram','kirkhor','jende','jendeh','madarjende','madar jende','madarjendeh','pedarsag','pedar sag','pedasag','haroomzade','harumzade','haramzade','haroomzadeh','kesafat','bisharaf','bi sharaf','koon','kooni','koonde','koonkesh','gooh','gohkhor','lashi','olagh','avazi','gaav','khafe sho','khafeh sho','beshash','ridam','ridi','sag pedar','pofyooz'].forEach(w=>add(['gaav','olagh','avazi','khafe sho','khafeh sho','lashi'].includes(w)?1:2,latin(w,{sfx:false}),'fa:'+w));
/* Arabic in Latin letters (Arabizi) */
['sharmouta','sharmoota','sharmota','kos omak','kosomak','kussomak','kus omak','kuss','qahba','manyak','manyook','ibn el kalb','ibnelkalb','ya kalb','ya hmar','ya 7mar','zebi','zeby','a7a','khawal','yel3an','telhas'].forEach(w=>add(['ya kalb','ya hmar','ya 7mar','a7a','telhas','yel3an'].includes(w)?1:2,latin(w),'ar:'+w));
/* Persian / Arabic script (whole words) */
const SCRIPT=[[2,'کیر'],[2,'کیرم'],[2,'کیری'],[2,'کسکش'],[2,'کس‌کش'],[2,'کس کش'],[2,'کسخل'],[2,'کس‌خل'],[2,'کس ننه'],[2,'کسننه'],[2,'جنده'],[2,'مادرجنده'],[2,'مادر جنده'],[2,'حرومزاده'],[2,'حرامزاده'],[2,'کونی'],[2,'کون'],[2,'کونکش'],[2,'بیشرف'],[2,'بی‌شرف'],[1,'کثافت'],[1,'لاشی'],[2,'گوه'],[1,'گوساله'],[1,'الاغ'],[1,'احمق'],[1,'خفه شو'],[2,'پدرسگ'],[2,'پدر سگ'],[2,'شرموطة'],[2,'شرموطه'],[2,'شرموط'],[2,'عرص'],[2,'منيوك'],[2,'كس امك'],[2,'كسمك'],[2,'قحبة'],[2,'قحبه'],[2,'زب'],[2,'خول'],[1,'ابن الكلب'],[1,'يا كلب'],[1,'يا حمار'],[1,'غبي'],[1,'حقير'],[3,'اقتلك'],[3,'سأقتلك'],[3,'میکشمت'],[3,'می‌کشمت']];
SCRIPT.forEach(([s,w])=>add(s,w.replace(/[ ‌]/g,'[\\s\\u200c]*'),'s:'+w));
/* words that look bad but are fine (fish names, aquarium words, everyday words) */
const OK=new Set(['shiite','shiites','shia','cocky','cockatiel','dickie','dickson','assam','assamese','hassle','harass','embarrass','scrappy','scrapbook','titan','titanic','titanium','title','titles','constitution','therapist','grape','grapes','analyst','canal','penistone','sussex','essex','middlesex','cumbria','documents','vacuum','accumulate','assess','assessment','bassist','passage','passive','compass','molasses','massachusetts','jurassic','cassava','cass','ambassador','assassins','bass','basses','class','classic','glass','grass','pass','passion','mass','massive','assistant','assist','assume','asset','assets','cockatoo','cockatoos','peacock','peacocks','cockle','cockroach','cocktail','cocktails','scunthorpe','shiitake','shitake','dickfeld','dickfeldi','dickfeld\'s','dickens','hancock','titmouse','arsenal','arsenic','analysis','cumin','cumulative','document','circumstance','cucumber','scum','spice','spicy','spicewood','kosher','kirby','skirt','koonin','coon\'s','raccoon','cocoon','tycoon','pakistan','pakistani','dogfish','pigfish','clownfish','clown loach','clownloach','clown pleco','clown knifefish','clown killifish','clown barb','clown rasbora','clown plec','pussycat','hoek','shitzu','wankel','nigeria','nigerian','niger','snigger','spicata','fagus','sharks','cuming','cumings','cuming\'s','spike','spikes','spiky','spiked','spikey','skunk','dicky','dickey']);
E.sort((a,b)=>b.src.length-a.src.length);const PAT=E.map(e=>'(?:'+e.src+')').join('|');
let RX=null,RXs=null;
try{RX=new RegExp('(^|[^\\p{L}\\p{N}])('+PAT+')(?![\\p{L}\\p{N}])','giu');RXs=new RegExp('(?:^|[^\\p{L}\\p{N}])(?:'+PAT+')(?![\\p{L}\\p{N}])','iu')}catch(e){
 try{RX=new RegExp('(^|[^A-Za-z0-9\\u0600-\\u06FF])('+PAT+')(?![A-Za-z0-9\\u0600-\\u06FF])','gi');RXs=new RegExp('(?:^|[^A-Za-z0-9\\u0600-\\u06FF])(?:'+PAT+')(?![A-Za-z0-9\\u0600-\\u06FF])','i')}catch(e2){RX=null}}
const ESub=E.map(e=>{try{return [e,new RegExp('^(?:'+e.src+')$','iu')]}catch(_){try{return [e,new RegExp('^(?:'+e.src+')$','i')]}catch(__){return null}}}).filter(Boolean);
const CTX=[[/^dicks?$/,/^('s)?\s+(tetra|tetras|platy|cichlid)/i],[/^puss(y|ies)$/,/^\s+willows?/i],[/^cocks?$/,/^\s+(of the rock|tail)/i],[/^cocks?$/,/^'s?\s*comb/i]];
const okWord=(full,m,after)=>{if(after!=null){const lw=m.toLowerCase();if(CTX.some(([a,b])=>a.test(lw)&&b.test(after)))return true}if(m.split(/[\s\u200c._\-]+/).some(t=>/^[^*\s]\*+$/.test(t)))return true;const w=m.toLowerCase().replace(/[^a-z؀-ۿ' ]/g,'').trim();if(OK.has(w))return true;
 /* fish / aquarium context: "clown loach", "dog fish", "pig nose turtle" */
 if(/^(clown|dog|pig|ugly|lame|nerd|freak|jerk|trash|garbage)$/.test(w))return true;return false};
const sevOf=m=>{let s=1,t='';for(const [e,r] of ESub){if(r.test(m)){if(e.sev>=s){s=e.sev;t=e.tag}}}if(!t){/* match was a "you are …" phrase */const p=ESub.find(([e,r])=>e.tag==='you-insult'&&r.test(m));if(p)t=p[0].tag}return{sev:s,tag:t}};
const starOf=w=>{const ch=[...w];let first=true;return ch.map(c=>{if(/[\s‌]/.test(c))return c;if(first){first=false;return c}return '*'}).join('')};
/* find all problems in a string */
function scan(text){const out=[];if(!RX||!text)return out;const s=String(text);if(s.length<2||!RXs.test(s))return out;RX.lastIndex=0;let m;
 while((m=RX.exec(s))){const w=m[2],start=m.index+m[1].length;if(!okWord(s,w,s.slice(start+w.length,start+w.length+24))){const {sev,tag}=sevOf(w);out.push({word:w,start,end:start+w.length,sev,tag})}if(RX.lastIndex===m.index)RX.lastIndex++}
 return out}
/* mask for display: keeps first letter, the rest become * (same length) */
function mask(text){if(!RX||text==null)return text;const s=String(text);if(s.length<2||!RXs.test(s))return s;const f=scan(s);if(!f.length)return s;let o='',p=0;for(const x of f){let a=x.start;if(x.tag==='you-insult'||/^(shut up|get lost|go to hell|suck my|you suck|screw you|piss off)$/.test(x.tag)){const k=x.word.search(/\S+$/);if(k>0&&x.tag==='you-insult')a=x.start+k}o+=s.slice(p,a)+starOf(s.slice(a,x.end));p=x.end}return o+s.slice(p)}
function check(text){const f=scan(text);return{ok:!f.length,found:f,sev:f.reduce((a,x)=>Math.max(a,x.sev),0),clean:f.length?mask(text):text}}
window.TMMOD={scan,mask,check,size:E.length};
})();
