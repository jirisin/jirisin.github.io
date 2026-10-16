/* Internal Developer Portal prototype — DevSecOpedia, catalog lists + entity page, history. */
window.IDPready = function () {
  const { $, $$, esc, toast, main, ST, save, routes, renderSidebar, topbar, home, sep, sel } = IDP;
  const { ENTITIES, OWNER_NAMES, RUNS, KB_TOPICS, KB_ARTICLES } = DB;
  const ME = 'unicorn-team';
  const ownerName = (o) => OWNER_NAMES[o] || o;
  const KIND_ICON = { Component: 'cube', API: 'plug', System: 'diagram-project', Resource: 'database' };
  const copy = (text, msg) => { try { navigator.clipboard.writeText(text); } catch (e) {} toast(msg); };
  const crumbs = (cur) => `${home}${sep}<span class="cur">${cur}</span>`;
  if (!ST.estar) ST.estar = ['ui-kit', 'payment-service'];
  const eStar = (id) => ST.estar.includes(id);

  /* =========================================================
     DevSecOpedia — knowledge-base index
     ========================================================= */
  const K = { q: '', topic: null, open: null };
  function kbList() {
    const q = K.q.trim().toLowerCase();
    const list = KB_ARTICLES.filter((a) => (K.topic === null || a.topic === K.topic) && (!q || (a.title + ' ' + a.summary + ' ' + a.excerpt).toLowerCase().includes(q)));
    const head = q ? `Results for “${esc(K.q.trim())}”` : K.topic !== null ? esc(KB_TOPICS[K.topic].name) : 'Popular articles';
    if (!list.length) return `<h2 class="h2">${head}</h2><div class="empty">No articles match. Try a different word or clear the topic.</div>`;
    return `<h2 class="h2">${head} <small>${list.length}</small></h2><div class="card kblist">${list.map((a) => {
      const open = K.open === a.id;
      return `<div class="kbrow ${open ? 'open' : ''}"><button class="kbhead" data-kbopen="${a.id}" aria-expanded="${open}"><span class="kbico"><i class="fa-solid fa-${KB_TOPICS[a.topic].icon}"></i></span><span class="kbt"><b>${esc(a.title)}</b><small>${esc(a.summary)}</small></span><span class="kbmeta">${esc(KB_TOPICS[a.topic].name)} · ${a.min} min · ${esc(a.updated)}</span><i class="fa-solid fa-chevron-down kbchev"></i></button>
        ${open ? `<div class="kbbody"><p>${esc(a.excerpt)}</p><button class="btn btn-o" data-soon="Full article">Read article</button></div>` : ''}</div>`;
    }).join('')}</div>`;
  }
  routes.docs = () => {
    renderSidebar('docs');
    main.innerHTML = topbar(crumbs('DevSecOpedia'))
      + `<div class="page kb"><div class="kbhero"><h1>DevSecOpedia</h1><p>Practical guidance on building, securing and running software here. Written by the teams who do it.</p>
        <label class="input kbsearch"><i class="fa-solid fa-magnifying-glass"></i><input id="kbq" placeholder="Search articles..." value="${esc(K.q)}" autocomplete="off"></label></div>
        <div class="tiles">${KB_TOPICS.map((t, i) => `<button class="card tile ${K.topic === i ? 'on' : ''}" data-kbtopic="${i}"><span class="tico"><i class="fa-solid fa-${t.icon}"></i></span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small><em>${KB_ARTICLES.filter((a) => a.topic === i).length} articles</em></button>`).join('')}</div>
        <div id="kblist">${kbList()}</div></div>`;
  };

  /* =========================================================
     Catalog lists — Libraries and All
     ========================================================= */
  const CS = {};
  const cs = (key) => CS[key] || (CS[key] = { q: '', kind: 'All', type: 'All', owner: 'All', life: 'All', show: 'all' });
  const base = (key) => (key === 'libraries' ? ENTITIES.filter((e) => e.kind === 'Component' && e.type === 'library') : ENTITIES);
  const uniq = (list, k) => [...new Set(list.map((e) => e[k]))].filter((v) => v && v !== '—').sort();
  const lc = (l) => `<span class="lc lc-${l}">${l}</span>`;
  function catRows(key) {
    const S = cs(key), q = S.q.trim().toLowerCase();
    return base(key).filter((e) => (S.kind === 'All' || e.kind === S.kind) && (S.type === 'All' || e.type === S.type) && (S.owner === 'All' || ownerName(e.owner) === S.owner) && (S.life === 'All' || e.lifecycle === S.life)
      && (S.show === 'all' || (S.show === 'owned' ? e.owner === ME : eStar(e.id))) && (!q || (e.name + ' ' + e.desc + ' ' + e.tags.join(' ')).toLowerCase().includes(q)));
  }
  function catTable(key) {
    const rows = catRows(key), isAll = key === 'all';
    if (!rows.length) return '<div class="card"><div class="empty" style="padding:32px;text-align:center">No entities match your filters.</div></div>';
    return `<div class="card"><table class="table cat"><thead><tr><th>Name</th>${isAll ? '<th>Kind</th>' : ''}<th>System</th><th>Owner</th>${isAll ? '<th>Type</th>' : ''}<th>Lifecycle</th><th>Description</th><th>Tags</th><th></th></tr></thead><tbody>
      ${rows.map((e) => `<tr><td><a class="elink" href="#/catalog/${e.id}">${esc(e.name)}</a></td>${isAll ? `<td>${e.kind}</td>` : ''}<td>${e.system === '—' ? '—' : `<span class="muted">${esc(e.system)}</span>`}</td><td>${esc(ownerName(e.owner))}</td>${isAll ? `<td>${esc(e.type)}</td>` : ''}<td>${lc(e.lifecycle)}</td><td class="edesc">${esc(e.desc)}</td><td><div class="tags">${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></td>
        <td class="more"><button class="rowbtn star ${eStar(e.id) ? 'on' : ''}" data-cstar="${e.id}" aria-label="${eStar(e.id) ? 'Unstar' : 'Star'} ${esc(e.name)}"><i class="${eStar(e.id) ? 'fa-solid' : 'fa-regular'} fa-star"></i></button></td></tr>`).join('')}</tbody></table></div>`;
  }
  const catHead = (key) => `${key === 'libraries' ? 'Libraries' : 'All'} <small>${catRows(key).length}</small>`;
  let curCat = 'all';
  function viewCatalog(key) {
    curCat = key;
    const S = cs(key), b = base(key), isAll = key === 'all';
    renderSidebar(key);
    main.innerHTML = topbar(crumbs(key === 'libraries' ? 'Libraries' : 'All'), '<button class="btn btn-p" data-soon="Register existing component"><i class="fa-solid fa-plus"></i>Create</button>')
      + `<div class="split page"><aside class="leftcol">
        <div class="card filterbox"><label class="input"><i class="fa-solid fa-magnifying-glass"></i><input id="cq" placeholder="Search" value="${esc(S.q)}" autocomplete="off"></label>
          ${isAll ? sel('ckind', 'Kind', uniq(b, 'kind'), S.kind) : ''}${sel('ctype', 'Type', uniq(b.filter((e) => S.kind === 'All' || e.kind === S.kind), 'type'), S.type)}${sel('cowner', 'Owner', uniq(b, 'owner').map(ownerName).sort(), S.owner)}${sel('clife', 'Lifecycle', ['production', 'experimental', 'deprecated'], S.life)}</div>
        <div class="catblock"><h3>Personal</h3><div class="card catlist">${[['all', 'All'], ['owned', 'Owned'], ['starred', 'Starred']].map(([k, l]) => `<button class="cat ${S.show === k ? 'on' : ''}" data-cshow="${k}">${l}</button>`).join('')}</div></div></aside>
        <div class="content"><h2 class="h2 first" id="chead">${catHead(key)}</h2><div id="ctable">${catTable(key)}</div></div></div>`;
  }
  const refreshCat = () => { $('#chead').innerHTML = catHead(curCat); $('#ctable').innerHTML = catTable(curCat); };
  routes.libraries = () => viewCatalog('libraries');
  routes.all = () => viewCatalog('all');

  /* =========================================================
     Entity page
     ========================================================= */
  const dependents = (id) => ENTITIES.filter((e) => e.deps.includes(id));
  const byId = (id) => ENTITIES.find((e) => e.id === id);
  const relList = (ids) => ids.length ? `<ul class="rel">${ids.map((i) => { const e = byId(i); return `<li><a class="elink" href="#/catalog/${e.id}"><i class="fa-solid fa-${KIND_ICON[e.kind]}"></i>${esc(e.name)}</a><span>${e.kind}${e.type !== '—' ? ' · ' + esc(e.type) : ''}</span></li>`; }).join('')}</ul>` : '<p class="muted pad">None.</p>';
  routes.catalog = (id, tab) => {
    const e = byId(id);
    if (!e) { location.hash = '#/all'; return; }
    tab = tab === 'dependencies' ? 'dependencies' : 'overview';
    renderSidebar(curCat);
    const up = e.deps, down = dependents(id).map((x) => x.id), prov = e.kind === 'API' ? 'Provided by' : 'Depends on', cons = e.kind === 'API' ? 'Consumed by' : 'Used by';
    const field = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
    let body;
    if (tab === 'overview') {
      body = `<div class="teamgrid"><div class="ecol">
          <div class="card"><div class="sh"><b>About</b></div><p class="pad edesc2">${esc(e.desc)}</p>
            <dl class="facts">${field('Owner', esc(ownerName(e.owner)))}${field('System', e.system === '—' ? '—' : `<a class="elink" href="#/catalog/${e.system}">${esc(e.system)}</a>`)}${field('Type', esc(e.type))}${field('Lifecycle', lc(e.lifecycle))}${field('Tags', e.tags.length ? `<div class="tags">${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '—')}</dl></div>
          <div class="card"><div class="sh"><b>${prov}</b><span class="muted">${up.length}</span></div>${relList(up)}</div>
          <div class="card"><div class="sh"><b>${cons}</b><span class="muted">${down.length}</span></div>${relList(down)}</div></div>
        <div class="side"><div class="card sidecard"><div class="sh"><b>Links</b><i class="fa-solid fa-link"></i></div><ul class="link nodisc">${[['github', 'Repository', 'fa-brands'], ['book', 'Runbook', 'fa-solid'], ['chart-line', 'Dashboard', 'fa-solid']].map(([ic, l, fam]) => `<li><a href="#/catalog/${e.id}" data-soon="${l}"><i class="${fam} fa-${ic}"></i>${l}</a></li>`).join('')}</ul></div></div></div>`;
    } else {
      const t = (title, ids) => `<div class="card"><div class="sh"><b>${title}</b><span class="muted">${ids.length}</span></div>${ids.length ? `<table class="table"><thead><tr><th>Name</th><th>Kind</th><th>Owner</th><th>Lifecycle</th></tr></thead><tbody>${ids.map((i) => { const x = byId(i); return `<tr><td><a class="elink" href="#/catalog/${x.id}">${esc(x.name)}</a></td><td>${x.kind}</td><td>${esc(ownerName(x.owner))}</td><td>${lc(x.lifecycle)}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted pad">None.</p>'}</div>`;
      body = `<div class="teamgrid" style="flex-direction:column;align-items:stretch">${t(prov, up)}${t(cons, down)}</div>`;
    }
    const list = curCat === 'libraries' ? ['libraries', 'Libraries'] : ['all', 'All'];
    main.innerHTML = topbar(`${home}${sep}<a href="#/${list[0]}">${list[1]}</a>${sep}<span class="cur">${esc(e.name)}</span>`).replace('<div class="divider"></div>', '')
      + `<div class="pagehead"><h1>${esc(e.name)}</h1><button class="btn btn-g star ${eStar(id) ? 'on' : ''}" data-cstar="${id}" data-entity aria-label="Star"><i class="${eStar(id) ? 'fa-solid' : 'fa-regular'} fa-star"></i></button><span class="kindchip"><i class="fa-solid fa-${KIND_ICON[e.kind]}"></i>${e.kind}</span></div>
      <div class="tabs">${[['overview', 'compass', 'Overview'], ['dependencies', 'diagram-project', 'Dependencies']].map(([k, ic, l]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/catalog/${id}/${k}"><i class="fa-solid fa-${ic}"></i>${l}</a>`).join('')}</div><div class="divider"></div><div class="page">${body}</div>`;
  };

  /* =========================================================
     History — template runs
     ========================================================= */
  const H = { q: '', status: 'All', owner: 'All' };
  const stat = (s) => `<span class="st st-${s.toLowerCase()}"><i class="fa-solid fa-${s === 'Completed' ? 'circle-check' : s === 'Failed' ? 'circle-xmark' : 'spinner fa-spin'}"></i>${s}</span>`;
  function histTable() {
    const q = H.q.trim().toLowerCase();
    const rows = RUNS.filter((r) => (H.status === 'All' || r.status === H.status) && (H.owner === 'All' || r.by === H.owner) && (!q || (r.tpl + ' ' + r.id + ' ' + r.by).toLowerCase().includes(q)));
    const head = `Template runs <small>${rows.length}</small>`;
    return [head, rows.length ? `<div class="card"><table class="table cat"><thead><tr><th>Run</th><th>Template</th><th>Started by</th><th>Started</th><th>Duration</th><th>Status</th></tr></thead><tbody>${rows.map((r) => `<tr><td><code>${r.id}</code></td><td><b>${esc(r.tpl)}</b></td><td>${esc(r.by)}</td><td>${esc(r.started)}</td><td>${esc(r.dur)}</td><td>${stat(r.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card"><div class="empty" style="padding:32px;text-align:center">No runs match your filters.</div></div>'];
  }
  routes.history = () => {
    renderSidebar('history');
    const [head, tbl] = histTable();
    main.innerHTML = topbar(`${home}${sep}<span>Self-Service Templates</span>${sep}<span class="cur">History</span>`)
      + `<div class="split page"><aside class="leftcol"><div class="card filterbox"><label class="input"><i class="fa-solid fa-magnifying-glass"></i><input id="hq" placeholder="Search runs..." value="${esc(H.q)}" autocomplete="off"></label>
        ${sel('hstatus', 'Status', ['Completed', 'Failed', 'Processing'], H.status)}${sel('howner', 'Started by', [...new Set(RUNS.map((r) => r.by))].sort(), H.owner)}</div></aside>
        <div class="content"><h2 class="h2 first" id="hhead">${head}</h2><div id="htable">${tbl}</div></div></div>`;
  };
  const refreshHist = () => { const [h, t] = histTable(); $('#hhead').innerHTML = h; $('#htable').innerHTML = t; };

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target; let el;
    if ((el = t.closest('[data-kbtopic]'))) { const i = +el.dataset.kbtopic; K.topic = K.topic === i ? null : i; K.open = null; $$('[data-kbtopic]').forEach((b) => b.classList.toggle('on', +b.dataset.kbtopic === K.topic)); $('#kblist').innerHTML = kbList(); }
    else if ((el = t.closest('[data-kbopen]'))) { K.open = K.open === el.dataset.kbopen ? null : el.dataset.kbopen; $('#kblist').innerHTML = kbList(); }
    else if ((el = t.closest('[data-cshow]'))) { cs(curCat).show = el.dataset.cshow; $$('[data-cshow]').forEach((b) => b.classList.toggle('on', b === el)); refreshCat(); }
    else if ((el = t.closest('[data-cstar]'))) {
      const id = el.dataset.cstar; ST.estar = eStar(id) ? ST.estar.filter((x) => x !== id) : [...ST.estar, id]; save();
      toast(eStar(id) ? 'Added to Starred' : 'Removed from Starred');
      if (el.hasAttribute('data-entity')) { el.classList.toggle('on', eStar(id)); el.innerHTML = `<i class="${eStar(id) ? 'fa-solid' : 'fa-regular'} fa-star"></i>`; } else refreshCat();
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'kbq') { K.q = t.value; K.open = null; $('#kblist').innerHTML = kbList(); }
    else if (t.id === 'cq') { cs(curCat).q = t.value; refreshCat(); }
    else if (t.id === 'hq') { H.q = t.value; refreshHist(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target, map = { ckind: 'kind', ctype: 'type', cowner: 'owner', clife: 'life' };
    if (map[t.id]) { cs(curCat)[map[t.id]] = t.value; if (t.id === 'ckind') cs(curCat).type = 'All'; if (t.id === 'ckind') viewCatalog(curCat); else refreshCat(); }
    else if (t.id === 'hstatus') { H.status = t.value; refreshHist(); }
    else if (t.id === 'howner') { H.owner = t.value; refreshHist(); }
  });
};
