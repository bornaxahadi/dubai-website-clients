"""siteopt.py <site_dir> — make a single-page client site fast:
self-host + WebP-compress all remote images, width/height + lazy/async, self-host subset fonts,
hero shows instantly, minify inline CSS. Layout stays pixel-identical. Safe to re-run.
Needs: pip install pillow fonttools brotli"""
import re,os,sys,io,hashlib,urllib.request
from PIL import Image
site=sys.argv[1];F=os.path.join(site,'index.html');s=open(F).read();n0=len(s)
UA={'User-Agent':'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
def fetch(u):return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read()
def webp(d,maxw,q=72):
    im=Image.open(io.BytesIO(d));im.load()
    if im.mode in('P','LA'):im=im.convert('RGBA')
    if im.width>maxw:im=im.resize((maxw,round(im.height*maxw/im.width)),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'WEBP',quality=q,method=6);return b.getvalue(),im.size
out={};sizes={}
os.makedirs(f'{site}/img/opt',exist_ok=True)
# 1. remote <img>/inline images -> local webp (og:image left absolute for link previews)
og=set(re.findall(r'<meta[^>]+content="(https?://[^"]+)"',s))
for u in sorted(set(re.findall(r'https?://[^"\'\s)`]+?\.(?:png|jpe?g|webp|gif)(?:\?[^"\'\s)`]*)?|https://images\.unsplash\.com/photo-[^"\'\s)`]+',s))):
    if u in og:continue
    w=int((re.search(r'[?&]w=(\d+)',u) or [0,'900'])[1]);w=min(w or 900,1200)
    try:d=fetch(u);b,sz=webp(d,w,80 if re.search(r'logo|fav|icon',u,re.I) else 72)
    except Exception as e:print('skip',u[:80],e);continue
    n='img/opt/'+hashlib.md5(u.encode()).hexdigest()[:10]+'.webp';open(f'{site}/{n}','wb').write(b);out[u]=n;sizes[n]=sz
    print(f'{len(d)//1024:>5}KB -> {len(b)//1024:>4}KB  {u[:70]}')
# 1b. JS image base + file list pattern  const U='https://..../';  [...,'file.png']
for m in re.finditer(r"const (\w+)='(https?://[^']+/)';",s):
    var,base=m.groups();names=sorted(set(re.findall(r"'([\w.-]+\.(?:png|jpe?g))'",s)))
    os.makedirs(f'{site}/img/{var.lower()}g',exist_ok=True);ok=[]
    for nm in names:
        try:b,_=webp(fetch(base+nm),900);open(f'{site}/img/{var.lower()}g/{nm.rsplit(".",1)[0]}.webp','wb').write(b);ok.append(nm)
        except Exception as e:print('skip',nm,e)
    if ok and len(ok)==len(names):
        s=s.replace(m.group(0),f"const {var}='img/{var.lower()}g/';")
        for nm in ok:s=s.replace(f"'{nm}'",f"'{nm.rsplit('.',1)[0]}.webp'")
        print('gallery',var,len(ok),'images localised')
for u,l in out.items():s=s.replace(u,l)
# 2. <img>: size, async decode, lazy except first
cnt=[0]
def fix(m):
    t=m.group(0);src=(re.search(r'src="([^"]+)"',t) or [None,''])[1]
    cnt[0]+=1
    if 'decoding=' not in t:t=t.replace('<img','<img decoding="async"',1)
    if cnt[0]>2 and 'loading=' not in t and 'fetchpriority' not in t:t=t.replace('<img','<img loading="lazy"',1)
    # intrinsic size only on lazy images whose box is set by CSS anyway (keeps above-the-fold layout identical)
    if 'loading="lazy"' in t and src in sizes and 'width=' not in t and not re.search(r'logo|fav|icon',src+t,re.I):t=t.replace('<img','<img width="%d" height="%d"'%sizes[src],1)
    return t
s=re.sub(r'<img\b[^>]*>',fix,s)
# 3. Google Fonts -> self-hosted, subset, instanced variable fonts
gf=re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/css2[^"]+)">',s)
if gf:
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    from fontTools import subset
    url=gf.group(1).replace('&amp;','&');css=fetch(url).decode() if False else urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'})).read().decode()
    text=re.sub(r'<[^>]+>',' ',s);uni=sorted({ord(c) for c in text if ord(c)<0x2FFF}|set(range(32,127))|{0x2019,0x2018,0x201C,0x201D,0x2013,0x2014,0x2026,0x2022,0x20AC,0x2192})
    os.makedirs(f'{site}/fonts',exist_ok=True);faces=[];pre=[]
    blocks=re.findall(r'/\* latin \*/\s*@font-face\s*\{([^}]*)\}',css)
    # keep Google's exact @font-face descriptors (one per latin block) and only swap src for a local subset of each distinct file
    local={}
    for bl in blocks:
        src=re.search(r'url\((https://[^)]+\.woff2)\)',bl).group(1);fam=re.search(r"font-family:\s*'([^']+)'",bl).group(1)
        if src not in local:
            fn=f"{fam.lower().replace(' ','-')}-{len(local)}.woff2";tf=TTFont(io.BytesIO(fetch(src)),lazy=False)
            o=subset.Options();o.flavor='woff2';o.layout_features=['*'];sb=subset.Subsetter(o);sb.populate(unicodes=uni);sb.subset(tf);tf.flavor='woff2';tf.save(f'{site}/fonts/{fn}');local[src]=fn
            if len(pre)<2:pre.append('<link rel="preload" href="fonts/%s" as="font" type="font/woff2" crossorigin>'%fn)
            print('font',fam,os.path.getsize(f'{site}/fonts/{fn}')//1024,'KB')
        b2=re.sub(r'src:[^;]+;',"src:url(fonts/%s) format('woff2');"%local[src],bl);b2=re.sub(r'unicode-range:[^;]+;?','',b2)
        faces.append('@font-face{'+re.sub(r'\s+',' ',b2).strip()+'}')
    s=re.sub(r'<link rel="preconnect" href="https://fonts\.(?:googleapis|gstatic)\.com"[^>]*>','',s)
    s=s.replace(gf.group(0),''.join(pre)+'<style>'+''.join(faces)+'</style>')
# 4. hero visible at once (LCP): first header's .rv reveals with CSS, not JS
if 'heroIn' not in s:
    s=s.replace('</head>',"<style>header .rv,.xhero .rv,.hero .rv{opacity:1;transform:none;transition:none;animation:heroIn .7s cubic-bezier(.2,.7,.2,1) both}@keyframes heroIn{from{opacity:.01;transform:translateY(18px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){header .rv,.xhero .rv,.hero .rv{animation:none}}</style></head>",1)
# 5. minify CSS + whitespace
def mc(c):
    if os.environ.get('NOMIN'):return c
    c=re.sub(r'/\*.*?\*/','',c,flags=re.S);c=re.sub(r'\s+',' ',c);c=re.sub(r'\s*([{};:,>])\s*',r'\1',c);return c.replace(';}','}').strip()
s=re.sub(r'(<style[^>]*>)(.*?)(</style>)',lambda m:m.group(1)+mc(m.group(2))+m.group(3),s,flags=re.S)
# (HTML whitespace is kept: removing it changes inline layout)
open(F,'w').write(s);print('html',n0,'->',len(s),'| remote imgs left:',len(re.findall(r'<img[^>]+src="https?://',s)))
