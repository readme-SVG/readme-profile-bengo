const LANG_COLORS = {
  JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572A5',
  Go:'#00add8', Rust:'#dea584', C:'#555555', 'C++':'#f34b7d',
  Ruby:'#701516', Java:'#b07219', PHP:'#4F5D95', Swift:'#f05138',
  Kotlin:'#A97BFF', Shell:'#89e051', HTML:'#e34c26', CSS:'#563d7c',
  Vue:'#41b883', Svelte:'#ff3e00', Dart:'#00b4ab', Scala:'#c22d40',
  Elixir:'#6e4a7e', Haskell:'#5e5086', Lua:'#000080', R:'#198CE7',
  Nix:'#7e7eff', Dockerfile:'#384d54',
};

function langColor(l) { return LANG_COLORS[l] || '#888888'; }

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

async function fetchGH(url, token) {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'gh-card/1.0' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(url, { headers });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error('GitHub ' + r.status + ': ' + body.slice(0, 100));
  }
  return r.json();
}

function buildHeatmap(events) {
  const counts = {};
  for (const e of events) {
    const d = e.created_at ? e.created_at.slice(0, 10) : null;
    if (d) counts[d] = (counts[d] || 0) + 1;
  }
  const weeks = [];
  const now = new Date();
  for (let w = 25; w >= 0; w--) {
    const col = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - (w * 7 + d));
      col.push(counts[dt.toISOString().slice(0, 10)] || 0);
    }
    weeks.push(col);
  }
  return weeks;
}

function heatColor(n) {
  if (n === 0) return '#1a1a24';
  if (n <= 1)  return '#3d2fa0';
  if (n <= 3)  return '#5b48e0';
  if (n <= 6)  return '#7c6af7';
  return '#a99cf9';
}

function eventIcon(type) {
  const m = {
    PushEvent:'◈', CreateEvent:'✦', WatchEvent:'★', ForkEvent:'⑂',
    IssuesEvent:'◎', PullRequestEvent:'⇄', IssueCommentEvent:'◉',
    ReleaseEvent:'◆', DeleteEvent:'✕',
  };
  return m[type] || '◇';
}

function eventDesc(e) {
  const r = e.repo && e.repo.name ? e.repo.name.split('/').pop() : '';
  const p = e.payload || {};
  switch (e.type) {
    case 'PushEvent':         return 'pushed ' + (p.commits ? p.commits.length : 0) + ' commit(s) to ' + r;
    case 'CreateEvent':       return 'created ' + (p.ref_type || 'ref') + ' in ' + r;
    case 'WatchEvent':        return 'starred ' + r;
    case 'ForkEvent':         return 'forked ' + r;
    case 'IssuesEvent':       return (p.action || 'opened') + ' issue in ' + r;
    case 'PullRequestEvent':  return (p.action || 'opened') + ' PR in ' + r;
    case 'IssueCommentEvent': return 'commented in ' + r;
    case 'ReleaseEvent':      return 'released ' + (p.release && p.release.tag_name || '') + ' in ' + r;
    default:                  return e.type.replace('Event','') + ' on ' + r;
  }
}

// ─────────────────────────────────────────────
//  SVG BUILDER  860 × 360
// ─────────────────────────────────────────────
function buildSVG(user, repos, events, theme) {
  const W = 860, H = 360;
  const isDark = theme !== 'light';
  const bg   = isDark ? '#0d0d14' : '#f6f8fa';
  const bg2  = isDark ? '#13131d' : '#ffffff';
  const bg3  = isDark ? '#1a1a27' : '#eaeef2';
  const col  = isDark ? '#e8e8f0' : '#1a1a2e';
  const mut  = isDark ? '#6b6b80' : '#57606a';
  const brd  = isDark ? 'rgba(255,255,255,.08)' : '#d0d7de';
  const ac1  = '#7c6af7';
  const ac2  = '#2dd4bf';
  const ac3  = '#f472b6';
  const gold = '#fbbf24';

  // --- data prep ---
  const langMap = {};
  repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
  const langs  = Object.entries(langMap).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const totalL = langs.reduce((s,[,v]) => s+v, 0) || 1;

  const topRepos = [...repos].sort((a,b) => b.stargazers_count - a.stargazers_count).slice(0, 3);

  const allCommits = [];
  events.forEach(e => {
    if (e.type === 'PushEvent' && e.payload && e.payload.commits) {
      e.payload.commits.forEach(c => {
        allCommits.push({
          sha:  (c.sha || '???????').slice(0, 7),
          msg:  (c.message || '').split('\n')[0].slice(0, 36),
          repo: e.repo && e.repo.name ? e.repo.name.split('/').pop() : '',
          time: e.created_at,
        });
      });
    }
  });
  const commits = shuffle(allCommits).slice(0, 4);

  const recentEvents = events.slice(0, 5);
  const heatmap = buildHeatmap(events);

  const spotCandidates = shuffle(repos.filter(r => !r.fork && r.description));
  const spotlight = spotCandidates[0] || null;

  // --- SVG helpers ---
  function R(x,y,w,h,fill,rx,stroke) {
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||10)+'" fill="'+fill+'" stroke="'+(stroke||brd)+'" stroke-width="1"/>';
  }
  function T(x,y,s,sz,fill,fw,anchor) {
    return '<text x="'+x+'" y="'+y+'" font-family="ui-monospace,Menlo,monospace" font-size="'+(sz||10)+'" fill="'+(fill||col)+'" font-weight="'+(fw||400)+'" text-anchor="'+(anchor||'start')+'">'+esc(s)+'</text>';
  }
  function L(x,y,s) {
    return '<text x="'+x+'" y="'+y+'" font-family="ui-monospace,Menlo,monospace" font-size="7.5" fill="'+mut+'" font-weight="600" letter-spacing="1.2">'+esc(s.toUpperCase())+'</text>';
  }
  function HR(x1,y1,x2,y2) {
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+brd+'" stroke-width="0.5"/>';
  }

  let o = '';
  o += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">';
  o += '<defs>';
  o += '<clipPath id="av"><circle cx="28" cy="28" r="22"/></clipPath>';
  o += '<linearGradient id="glo" x1="0" y1="0" x2="1" y2="1">';
  o += '<stop offset="0%" stop-color="'+ac1+'" stop-opacity="0.1"/>';
  o += '<stop offset="100%" stop-color="transparent"/>';
  o += '</linearGradient>';
  o += '</defs>';

  // BG
  o += R(0,0,W,H,bg,16,'none');
  o += '<rect width="'+W+'" height="'+H+'" rx="16" fill="url(#glo)"/>';

  // ═══ COLUMN 1  x=16  w=269 ═══

  // [1] Profile  y=16 h=80
  o += R(16,16,269,80,bg2);
  o += '<image href="'+esc(user.avatar_url)+'&amp;s=96" x="22" y="22" width="44" height="44" clip-path="url(#av)"/>';
  o += '<circle cx="44" cy="44" r="22" fill="none" stroke="'+brd+'" stroke-width="1.5"/>';
  o += T(76,38,(user.name||user.login).slice(0,22),12,col,700);
  o += T(76,51,'@'+user.login,8.5,ac1);
  if (user.bio)      o += T(76,63,user.bio.slice(0,30)+(user.bio.length>30?'…':''),7.5,mut);
  if (user.location) o += T(76,76,'◎ '+user.location.slice(0,26),7.5,ac2);

  // [2] 4 stat mini  y=106 h=44
  const stats = [
    {l:'REPOS',    v:user.public_repos},
    {l:'STARS',    v:repos.reduce((s,r)=>s+r.stargazers_count,0)},
    {l:'FOLLOWERS',v:user.followers},
    {l:'FOLLOWING',v:user.following},
  ];
  stats.forEach(function(s,i) {
    const sx = 16 + i*68;
    o += R(sx,106,62,44,bg2);
    o += T(sx+31,126,String(s.v),13,col,700,'middle');
    o += '<text x="'+(sx+31)+'" y="140" font-family="ui-monospace,Menlo,monospace" font-size="6" fill="'+mut+'" font-weight="600" letter-spacing="0.8" text-anchor="middle">'+esc(s.l)+'</text>';
  });

  // [3] Commits  y=160 h=185
  o += R(16,160,269,185,bg2);
  o += L(28,175,'◉ random commits');
  if (commits.length) {
    commits.forEach(function(c,i) {
      const cy = 185 + i*34;
      o += T(28,cy,c.sha,7.5,ac3,500);
      o += T(28,cy+12,c.msg||'(empty)',8.5,col);
      o += T(28,cy+23,(c.repo||'?')+' · '+timeAgo(c.time),7,mut);
      if (i < commits.length-1) o += HR(28,cy+28,273,cy+28);
    });
  } else {
    o += T(28,205,'no recent push events found',8,mut);
  }

  // ═══ COLUMN 2  x=295  w=269 ═══

  // [4] Languages  y=16 h=80
  o += R(295,16,269,80,bg2);
  o += L(307,30,'◆ languages');
  const barX=307, barY=36, barW=245, barH=5;
  o += R(barX,barY,barW,barH,bg3,2,'none');
  let bxOff = barX;
  langs.forEach(function([l,n]) {
    const w = (n/totalL)*barW;
    o += '<rect x="'+bxOff.toFixed(1)+'" y="'+barY+'" width="'+w.toFixed(1)+'" height="'+barH+'" rx="2" fill="'+langColor(l)+'"/>';
    bxOff += w;
  });
  langs.forEach(function([l,n],i) {
    const lx = 307 + (i%3)*83;
    const ly = 52  + Math.floor(i/3)*16;
    o += '<circle cx="'+(lx+4)+'" cy="'+(ly-4)+'" r="3.5" fill="'+langColor(l)+'"/>';
    o += T(lx+12,ly,l.slice(0,10)+' '+((n/totalL)*100).toFixed(0)+'%',8,col);
  });

  // [5] Heatmap  y=106 h=75
  o += R(295,106,269,75,bg2);
  o += L(307,120,'◈ activity (26w)');
  heatmap.forEach(function(col2,wi) {
    col2.forEach(function(n,di) {
      o += '<rect x="'+(307+wi*9.8).toFixed(1)+'" y="'+(127+di*7)+'" width="7.5" height="5.5" rx="1.5" fill="'+heatColor(n)+'"/>';
    });
  });

  // [6] Events  y=191 h=154
  o += R(295,191,269,154,bg2);
  o += L(307,205,'◇ recent events');
  if (recentEvents.length) {
    recentEvents.forEach(function(e,i) {
      const ey = 217 + i*25;
      o += T(307,ey,eventIcon(e.type),9,ac1,500);
      o += T(320,ey,eventDesc(e).slice(0,30),8,col);
      o += T(320,ey+12,timeAgo(e.created_at),7,mut);
      if (i < recentEvents.length-1) o += HR(307,ey+17,552,ey+17);
    });
  } else {
    o += T(307,225,'no public events',8,mut);
  }

  // ═══ COLUMN 3  x=574  w=270 ═══

  // [7] Top starred  y=16 h=130
  o += R(574,16,270,130,bg2);
  o += L(586,30,'★ top starred');
  if (topRepos.length) {
    topRepos.forEach(function(r,i) {
      const ry = 40 + i*30;
      o += T(586,ry+10,'#'+(i+1),8,mut,700);
      o += T(602,ry+10,r.name.slice(0,22),9,ac1,500);
      if (r.description) o += T(602,ry+21,r.description.slice(0,30)+'…',7.5,mut);
      o += T(602,ry+28,'★ '+r.stargazers_count+(r.language?' · '+r.language:''),7,gold);
      if (i < topRepos.length-1) o += HR(586,ry+33,832,ry+33);
    });
  } else {
    o += T(586,55,'no repos found',8,mut);
  }

  // [8] Spotlight  y=156 h=105
  o += R(574,156,270,105,bg2);
  o += L(586,170,'◆ random spotlight');
  if (spotlight) {
    o += T(586,186,spotlight.name.slice(0,26),10,ac1,600);
    const words = spotlight.description.split(' ');
    let ln='', lny=200;
    for (let wi=0; wi<words.length; wi++) {
      const test = ln ? ln+' '+words[wi] : words[wi];
      if (test.length > 30) {
        o += T(586,lny,ln,8,mut);
        ln = words[wi]; lny += 13;
        if (lny > 230) { o += T(586,lny,ln+'…',8,mut); ln=''; break; }
      } else { ln = test; }
    }
    if (ln && lny<=230) o += T(586,lny,ln,8,mut);
    o += T(586,244,'★ '+spotlight.stargazers_count+'  ⑂ '+spotlight.forks_count,8,gold);
    if (spotlight.language) {
      o += '<circle cx="588" cy="252" r="4" fill="'+langColor(spotlight.language)+'"/>';
      o += T(596,255,spotlight.language,7.5,mut);
    }
  } else {
    o += T(586,190,'no repos with descriptions',8,mut);
  }

  // [9] Footer  y=271 h=18
  o += R(574,271,270,18,bg3,6);
  o += '<text x="709" y="283" font-family="ui-monospace,Menlo,monospace" font-size="7" fill="'+mut+'" text-anchor="middle" letter-spacing="0.3">github.com/'+esc(user.login)+' · gh-card</text>';

  o += '</svg>';
  return o;
}

// ─────────────────────────────────────────────
//  VERCEL HANDLER  (CommonJS)
// ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  const username = req.query && req.query.user  ? req.query.user  : null;
  const theme    = req.query && req.query.theme ? req.query.theme : 'dark';

  function errSVG(msg) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">'
      + '<rect width="500" height="80" rx="10" fill="#0d0d14" stroke="rgba(255,255,255,.08)" stroke-width="1"/>'
      + '<text x="20" y="28" font-family="monospace" font-size="11" fill="#f472b6" font-weight="600">gh-card error</text>'
      + '<text x="20" y="48" font-family="monospace" font-size="9" fill="#6b6b80">'+esc(String(msg).slice(0,65))+'</text>'
      + '<text x="20" y="65" font-family="monospace" font-size="8" fill="#3d2fa0">set GITHUB_TOKEN env var to raise rate limit</text>'
      + '</svg>';
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!username) {
    return res.status(200).send(errSVG('Missing ?user= query param'));
  }

  const token = process.env.GITHUB_TOKEN || '';

  try {
    const base = 'https://api.github.com';
    const [user, repos, events] = await Promise.all([
      fetchGH(base+'/users/'+username, token),
      fetchGH(base+'/users/'+username+'/repos?sort=updated&per_page=100', token),
      fetchGH(base+'/users/'+username+'/events/public?per_page=100', token),
    ]);

    const svg = buildSVG(user, repos, events, theme);

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).send(svg);

  } catch (err) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(errSVG(err.message));
  }
};
