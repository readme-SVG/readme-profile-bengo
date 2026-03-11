const W = 495, H = 195;

const LC = {
  JavaScript:'#f7df1e',TypeScript:'#3178c6',Python:'#3572A5',Go:'#00add8',
  Rust:'#dea584',C:'#555555','C++':'#f34b7d',Ruby:'#701516',Java:'#b07219',
  PHP:'#4F5D95',Swift:'#f05138',Kotlin:'#A97BFF',Shell:'#89e051',
  HTML:'#e34c26',CSS:'#563d7c',Vue:'#41b883',Svelte:'#ff3e00',Dart:'#00b4ab',
  Scala:'#c22d40',Elixir:'#6e4a7e',Haskell:'#5e5086',Lua:'#000080',R:'#198CE7',
  Nix:'#7e7eff',Dockerfile:'#384d54',
};
const lc = l => LC[l] || '#8b949e';

const GH = {
  text:'#e6edf3', sec:'#8b949e', mut:'#6e7681',
  border:'#30363d', card:'rgba(22,27,34,0.85)',
  blue:'#58a6ff', green:'#3fb950', yellow:'#d29922',
  orange:'#db6d28', red:'#f85149', purple:'#bc8cff', pink:'#ff7b72',
};

function esc(s) {
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function shuffle(a) {
  const b=[...a];
  for(let i=b.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[b[i],b[j]]=[b[j],b[i]];}
  return b;
}
function ago(iso) {
  if(!iso) return '?';
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<3600)  return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  if(s<86400*30) return Math.floor(s/86400)+'d ago';
  if(s<86400*365) return Math.floor(s/86400/30)+'mo ago';
  return Math.floor(s/86400/365)+'y ago';
}
function fmt(n) {
  if(n>=1e6) return (n/1e6).toFixed(1)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'k';
  return String(n);
}
function wrap(text,max) {
  const words=String(text||'').split(' '),lines=[];let cur='';
  for(const w of words){const t=cur?cur+' '+w:w;if(t.length>max){if(cur)lines.push(cur);cur=w;}else cur=t;}
  if(cur)lines.push(cur);return lines;
}

const SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO="ui-monospace,'SFMono-Regular','SF Mono',Menlo,Consolas,monospace";
function T(x,y,s,sz,fill,fw,an){return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${sz||13}" fill="${esc(fill||GH.text)}" font-weight="${fw||400}" text-anchor="${an||'start'}">${esc(s)}</text>`;}
function TM(x,y,s,sz,fill,fw,an){return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${sz||11}" fill="${esc(fill||GH.text)}" font-weight="${fw||400}" text-anchor="${an||'start'}">${esc(s)}</text>`;}
function svg(inner){return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;}

async function gh(url,token){
  const h={'Accept':'application/vnd.github+json','User-Agent':'gh-card/3'};
  if(token)h['Authorization']='Bearer '+token;
  const r=await fetch(url,{headers:h});
  if(!r.ok)throw new Error('GitHub '+r.status+' ('+url.split('/').slice(-2).join('/')+')');
  return r.json();
}

// ════════════ SLIDES ════════════

function slideStat(value,label,color){
  const cx=W/2,cy=H/2-12;let o='';
  o+=`<circle cx="${cx}" cy="${cy}" r="78" fill="${color}" opacity="0.04"/>`;
  o+=`<circle cx="${cx}" cy="${cy}" r="50" fill="${color}" opacity="0.05"/>`;
  o+=T(cx,cy+14,fmt(value),60,GH.text,700,'middle');
  o+=T(cx,cy+36,label,13,color,600,'middle');
  return svg(o);
}

function slideLangBar(repos){
  const map={};repos.forEach(r=>{if(r.language)map[r.language]=(map[r.language]||0)+1;});
  const langs=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const tot=langs.reduce((s,[,v])=>s+v,0)||1;
  let o='';
  const bx=16,by=14,bw=W-32,bh=10;
  o+=`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="${GH.border}"/>`;
  let off=bx;
  langs.forEach(([l,n],i)=>{const w=Math.max((n/tot)*bw,2);o+=`<rect x="${off.toFixed(1)}" y="${by}" width="${w.toFixed(1)}" height="${bh}" rx="${i===0?5:0}" fill="${lc(l)}"/>`;off+=w;});
  langs.forEach(([l,n],i)=>{
    const col=i<3?0:1,row=i<3?i:i-3,lx=16+col*246,ly=42+row*46;
    o+=`<circle cx="${lx+7}" cy="${ly+9}" r="7" fill="${lc(l)}"/>`;
    o+=T(lx+20,ly+13,l,13,GH.text,600);
    o+=T(lx+20,ly+29,((n/tot)*100).toFixed(1)+'%  ·  '+n+' repos',11,GH.sec);
  });
  return svg(o);
}

function slideTopRepos(repos){
  const top=[...repos].sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,3);
  let o='';
  top.forEach((r,i)=>{
    const ry=8+i*60;
    o+=`<rect x="8" y="${ry}" width="${W-16}" height="52" rx="6" fill="${GH.card}" stroke="${GH.border}" stroke-width="1"/>`;
    o+=`<rect x="8" y="${ry}" width="3" height="52" rx="2" fill="${GH.blue}" opacity="${1-i*0.3}"/>`;
    o+=T(20,ry+20,r.name.slice(0,32),13,GH.blue,600);
    o+=T(W-16,ry+20,'★ '+fmt(r.stargazers_count),12,GH.yellow,600,'end');
    o+=T(20,ry+37,(r.description||'').slice(0,56),11,GH.sec);
    if(r.language){o+=`<circle cx="${W-52}" cy="${ry+32}" r="5" fill="${lc(r.language)}"/>`;o+=T(W-43,ry+37,r.language.slice(0,12),10,GH.mut);}
  });
  return svg(o);
}

function slideCommits(commits){
  const picks=shuffle(commits).slice(0,2);let o='';
  if(!picks.length){
    o+=T(W/2,H/2-8,'no public commits found',13,GH.sec,400,'middle');
    o+=T(W/2,H/2+12,'activity may be in private repos',11,GH.mut,400,'middle');
    return svg(o);
  }
  picks.forEach((c,i)=>{
    const ry=8+i*90;
    o+=`<rect x="8" y="${ry}" width="${W-16}" height="82" rx="6" fill="${GH.card}" stroke="${GH.border}" stroke-width="1"/>`;
    o+=`<rect x="14" y="${ry+10}" width="62" height="18" rx="5" fill="rgba(188,140,255,.12)" stroke="${GH.purple}" stroke-width="0.5"/>`;
    o+=TM(18,ry+23,c.sha,10,GH.purple,600);
    o+=T(84,ry+23,c.repo.slice(0,22),11,GH.sec);
    o+=T(W-14,ry+23,ago(c.time),10,GH.mut,400,'end');
    const lines=wrap(c.msg,60);
    lines.slice(0,2).forEach((l,li)=>o+=T(14,ry+44+li*18,l,12,GH.text));
  });
  return svg(o);
}

function slideEvents(events){
  const icons={PushEvent:'↑',CreateEvent:'+',WatchEvent:'★',ForkEvent:'⑂',IssuesEvent:'●',PullRequestEvent:'⇄',IssueCommentEvent:'◉',ReleaseEvent:'◆',DeleteEvent:'−'};
  const colors={PushEvent:GH.blue,CreateEvent:GH.green,WatchEvent:GH.yellow,ForkEvent:GH.purple,IssuesEvent:GH.red,PullRequestEvent:GH.green,IssueCommentEvent:GH.blue,ReleaseEvent:GH.orange,DeleteEvent:GH.red};
  function desc(e){
    const repo=e.repo&&e.repo.name?e.repo.name:'';const p=e.payload||{};
    switch(e.type){
      case 'PushEvent':return['pushed '+(p.commits&&p.commits.length||0)+' commit(s)',repo];
      case 'CreateEvent':return['created '+(p.ref_type||'ref'),p.ref||repo.split('/').pop()];
      case 'WatchEvent':return['starred',repo];case 'ForkEvent':return['forked',repo];
      case 'IssuesEvent':return[(p.action||'opened')+' issue',repo];
      case 'PullRequestEvent':return[(p.action||'opened')+' PR',repo];
      case 'IssueCommentEvent':return['commented on issue',repo];
      case 'ReleaseEvent':return['released '+(p.release&&p.release.tag_name||''),repo.split('/').pop()];
      default:return[e.type.replace('Event',''),repo];
    }
  }
  const picks=events.slice(0,2);let o='';
  picks.forEach((e,i)=>{
    const ry=8+i*90,col=colors[e.type]||GH.sec;
    o+=`<rect x="8" y="${ry}" width="${W-16}" height="82" rx="6" fill="${GH.card}" stroke="${GH.border}" stroke-width="1"/>`;
    o+=`<circle cx="38" cy="${ry+41}" r="20" fill="${col}" opacity="0.1"/>`;
    o+=`<text x="38" y="${ry+48}" font-family="${SANS}" font-size="18" fill="${col}" text-anchor="middle" font-weight="600">${icons[e.type]||'◇'}</text>`;
    const[line1,line2]=desc(e);
    o+=T(68,ry+28,line1.slice(0,42),13,GH.text,600);
    o+=T(68,ry+46,line2.slice(0,42),11,GH.blue);
    o+=T(68,ry+63,ago(e.created_at),10,GH.mut);
    o+=T(W-14,ry+28,e.type.replace('Event',''),10,GH.mut,400,'end');
  });
  return svg(o);
}

function slideSpotlight(repos){
  const r=shuffle(repos.filter(x=>!x.fork&&x.description))[0];
  if(!r)return svg(T(W/2,H/2,'no repos with descriptions',13,GH.sec,400,'middle'));
  let o='';
  o+=T(16,36,r.name.slice(0,32),18,GH.blue,700);
  const lines=wrap(r.description,56);
  lines.slice(0,3).forEach((l,i)=>o+=T(16,58+i*17,l,11,GH.sec));
  const sy=58+Math.min(lines.length,3)*17+10;
  o+=T(16,sy,'★ '+fmt(r.stargazers_count),13,GH.yellow,600);
  o+=T(90,sy,'⑂ '+fmt(r.forks_count),13,GH.purple,600);
  if(r.open_issues_count!==undefined)o+=T(160,sy,'● '+r.open_issues_count,13,GH.sec,600);
  if(r.language){o+=`<circle cx="17" cy="${sy+16}" r="6" fill="${lc(r.language)}"/>`;o+=T(28,sy+20,r.language,11,GH.sec);}
  if(r.topics&&r.topics.length){
    let tx=r.language?28+r.language.length*6+16:16;
    r.topics.slice(0,4).forEach(t=>{
      const tw=t.length*5.5+16;if(tx+tw>W-12)return;
      o+=`<rect x="${tx.toFixed(0)}" y="${sy+8}" width="${tw.toFixed(0)}" height="16" rx="8" fill="rgba(56,139,253,.15)" stroke="${GH.blue}" stroke-width="0.5"/>`;
      o+=T(tx+8,sy+20,t.slice(0,12),8,GH.blue);tx+=tw+5;
    });
  }
  return svg(o);
}

function slideLangList(repos){
  const map={};repos.forEach(r=>{if(r.language)map[r.language]=(map[r.language]||0)+1;});
  const langs=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const tot=langs.reduce((s,[,v])=>s+v,0)||1;const maxV=langs[0]?langs[0][1]:1;
  let o='';
  langs.forEach(([l,n],i)=>{
    const ly=14+i*34,pct=(n/tot)*100,bw=Math.max((n/maxV)*(W-160),4);
    o+=`<circle cx="22" cy="${ly+12}" r="7" fill="${lc(l)}"/>`;
    o+=T(36,ly+16,l,12,GH.text,600);
    o+=`<rect x="138" y="${ly+5}" width="${(W-155).toFixed(0)}" height="14" rx="7" fill="${GH.border}"/>`;
    o+=`<rect x="138" y="${ly+5}" width="${bw.toFixed(1)}" height="14" rx="7" fill="${lc(l)}" opacity="0.85"/>`;
    o+=T(W-14,ly+16,pct.toFixed(1)+'%',11,GH.sec,500,'end');
  });
  return svg(o);
}

function slideMostForked(repos){
  const top=[...repos].filter(r=>!r.fork).sort((a,b)=>b.forks_count-a.forks_count).slice(0,3);
  let o='';
  top.forEach((r,i)=>{
    const ry=8+i*60;
    o+=`<rect x="8" y="${ry}" width="${W-16}" height="52" rx="6" fill="${GH.card}" stroke="${GH.border}" stroke-width="1"/>`;
    o+=`<rect x="8" y="${ry}" width="3" height="52" rx="2" fill="${GH.purple}" opacity="${1-i*0.3}"/>`;
    o+=T(20,ry+20,r.name.slice(0,32),13,GH.blue,600);
    o+=T(W-16,ry+20,'⑂ '+fmt(r.forks_count),12,GH.purple,600,'end');
    o+=T(20,ry+37,(r.description||'').slice(0,56),11,GH.sec);
    if(r.language){o+=`<circle cx="${W-52}" cy="${ry+32}" r="5" fill="${lc(r.language)}"/>`;o+=T(W-43,ry+37,r.language.slice(0,12),10,GH.mut);}
  });
  return svg(o);
}

function slideAvgStars(repos){
  const own=repos.filter(r=>!r.fork);
  const total=own.reduce((s,r)=>s+r.stargazers_count,0);
  const avg=own.length?(total/own.length):0;
  const cx=W/2,cy=H/2-12;let o='';
  o+=`<circle cx="${cx}" cy="${cy}" r="78" fill="${GH.yellow}" opacity="0.04"/>`;
  o+=`<circle cx="${cx}" cy="${cy}" r="50" fill="${GH.yellow}" opacity="0.05"/>`;
  o+=T(cx,cy+14,avg<10?avg.toFixed(1):Math.round(avg).toString(),60,GH.text,700,'middle');
  o+=T(cx,cy+36,'avg stars per repo',13,GH.yellow,600,'middle');
  o+=T(cx,cy+54,'('+own.length+' original repos)',11,GH.mut,400,'middle');
  return svg(o);
}

function slideAccountAge(user){
  const created=new Date(user.created_at);
  const yrs=new Date().getFullYear()-created.getFullYear();
  const cx=W/2,cy=H/2-12;let o='';
  o+=`<circle cx="${cx}" cy="${cy}" r="78" fill="${GH.green}" opacity="0.04"/>`;
  o+=`<circle cx="${cx}" cy="${cy}" r="50" fill="${GH.green}" opacity="0.05"/>`;
  o+=T(cx,cy+14,yrs+'y',60,GH.text,700,'middle');
  o+=T(cx,cy+36,'on github',13,GH.green,600,'middle');
  o+=T(cx,cy+54,'since '+created.toLocaleDateString('en-US',{month:'short',year:'numeric'}),11,GH.mut,400,'middle');
  return svg(o);
}

function slideTotalForks(repos){return slideStat(repos.filter(r=>!r.fork).reduce((s,r)=>s+r.forks_count,0),'total forks received',GH.purple);}
function slideIssues(repos){return slideStat(repos.filter(r=>!r.fork).reduce((s,r)=>s+(r.open_issues_count||0),0),'open issues across repos',GH.red);}

// ════════════ ALL SLIDES REGISTRY ════════════
// Each entry: { id, fn }  — id is stable string key
const ALL_SLIDES = [
  { id:'repos',       fn:(u,r,e,c)=>slideStat(u.public_repos,'public repositories',GH.blue) },
  { id:'stars',       fn:(u,r,e,c)=>slideStat(r.reduce((s,x)=>s+x.stargazers_count,0),'total stars earned',GH.yellow) },
  { id:'followers',   fn:(u,r,e,c)=>slideStat(u.followers,'followers',GH.green) },
  { id:'following',   fn:(u,r,e,c)=>slideStat(u.following,'following',GH.pink) },
  { id:'langbar',     fn:(u,r,e,c)=>slideLangBar(r) },
  { id:'toprepos',    fn:(u,r,e,c)=>slideTopRepos(r) },
  { id:'commits',     fn:(u,r,e,c)=>slideCommits(c) },
  { id:'events',      fn:(u,r,e,c)=>slideEvents(e) },
  { id:'spotlight',   fn:(u,r,e,c)=>slideSpotlight(r) },
  { id:'langlist',    fn:(u,r,e,c)=>slideLangList(r) },
  { id:'forked',      fn:(u,r,e,c)=>slideMostForked(r) },
  { id:'avgstars',    fn:(u,r,e,c)=>slideAvgStars(r) },
  { id:'age',         fn:(u,r,e,c)=>slideAccountAge(u) },
  { id:'forks',       fn:(u,r,e,c)=>slideTotalForks(r) },
  { id:'issues',      fn:(u,r,e,c)=>slideIssues(r) },
];

// ════════════ PICKER ════════════
// slides param: comma-separated ids, e.g. "repos,stars,commits"
// _slide param: override index within enabled list (for preview)
function pickSlide(user, repos, events, commits, slidesParam, overrideIdx) {
  let enabled = ALL_SLIDES;
  if (slidesParam) {
    const ids = slidesParam.split(',').map(s=>s.trim()).filter(Boolean);
    if (ids.length > 0) {
      enabled = ALL_SLIDES.filter(s => ids.includes(s.id));
      if (!enabled.length) enabled = ALL_SLIDES;
    }
  }
  const bucket = Math.floor(Date.now()/(10*60*1000));
  const idx = (overrideIdx!==undefined && overrideIdx>=0 && overrideIdx<enabled.length)
    ? overrideIdx
    : bucket % enabled.length;
  return enabled[idx].fn(user, repos, events, commits);
}

// ════════════ HANDLER ════════════
module.exports = async function handler(req, res) {
  const q = req.query||{};
  const username = q.user||null;
  res.setHeader('Content-Type','image/svg+xml');
  res.setHeader('Access-Control-Allow-Origin','*');

  const errSVG = msg =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="80" viewBox="0 0 ${W} 80">`
    +`<rect width="${W}" height="80" rx="6" fill="${GH.card}" stroke="${GH.border}" stroke-width="1"/>`
    +`<text x="14" y="30" font-family="monospace" font-size="11" fill="${GH.red}" font-weight="600">gh-card error</text>`
    +`<text x="14" y="48" font-family="monospace" font-size="9" fill="${GH.sec}">${esc(String(msg).slice(0,70))}</text>`
    +`<text x="14" y="63" font-family="monospace" font-size="8" fill="${GH.mut}">set GITHUB_TOKEN env var to raise rate limit</text>`
    +`</svg>`;

  if(!username) return res.status(200).send(errSVG('Missing ?user= query param'));

  const token = process.env.GITHUB_TOKEN||'';
  try {
    const base = 'https://api.github.com';
    const [user, repos, events] = await Promise.all([
      gh(`${base}/users/${username}`, token),
      gh(`${base}/users/${username}/repos?sort=updated&per_page=100`, token),
      gh(`${base}/users/${username}/events/public?per_page=100`, token),
    ]);

    // fetch real commits
    let commits = [];
    const reposSorted = [...repos].sort((a,b)=>new Date(b.pushed_at)-new Date(a.pushed_at));
    for (const repo of reposSorted.filter(r=>!r.fork&&r.pushed_at).slice(0,3)) {
      try {
        const data = await gh(`${base}/repos/${username}/${repo.name}/commits?per_page=20&author=${username}`, token);
        if (Array.isArray(data)&&data.length) {
          commits.push(...data.map(c=>({
            sha:  c.sha?c.sha.slice(0,7):'???????',
            msg:  c.commit&&c.commit.message?(c.commit.message.split('\n')[0].trim()||'update'):'update',
            repo: repo.name,
            time: c.commit&&c.commit.author?c.commit.author.date:repo.pushed_at,
          })));
        }
      } catch(e) { /* skip */ }
      if (commits.length>=10) break;
    }
    // fallback: push events
    events.forEach(e=>{
      if(e.type==='PushEvent'&&e.payload&&e.payload.commits){
        e.payload.commits.forEach(c=>{
          commits.push({
            sha:  c.sha?c.sha.slice(0,7):'???????',
            msg:  (c.message||'').split('\n')[0].trim()||'update',
            repo: e.repo&&e.repo.name?e.repo.name.split('/').pop():'?',
            time: e.created_at,
          });
        });
      }
    });

    const overrideIdx = q._slide!==undefined ? parseInt(q._slide,10) : undefined;
    const slidesParam = q.slides||'';
    const svgOut = pickSlide(user, repos, events, commits, slidesParam, overrideIdx);
    const isPreview = overrideIdx !== undefined;
    res.setHeader('Cache-Control', isPreview ? 'no-cache' : 's-maxage=600,stale-while-revalidate=60');
    return res.status(200).send(svgOut);
  } catch(err) {
    res.setHeader('Cache-Control','no-cache');
    return res.status(200).send(errSVG(err.message));
  }
};
