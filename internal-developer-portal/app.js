/* Internal Developer Portal prototype — routing and interactions. All data is fictional (see data.js). */
(function () {
  const { TYPES, OWNERS, CATS, TEMPLATES, MEMBERS, PROJECTS, STEPS } = DB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sidebar = $('#sidebar'), main = $('#main');

  const TINT = { Request: '#1e3a8a', Create: '#14532d', Configure: '#713f12', Delete: '#7f1d1d' };
  const SOON = 'Not part of the designed screens yet';

  /* ---------- state ---------- */
  const KEY = 'idp-proto-v1';
  let ST = { starred: TEMPLATES.filter((t) => t.starred).map((t) => t.id) };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.starred) ST = o; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };
  const isStar = (id) => ST.starred.includes(id);

  const F = { q: '', type: 'All', owner: 'All', cat: 'Starred', open: {} };       // template filters
  const team = {};                                                              // project id -> members (mutable copy)
  PROJECTS.forEach((p) => { team[p.id] = MEMBERS.map((m) => ({ ...m })); });
  let W = null;                                                                 // wizard state

  const toast = (m) => { const t = $('#toast'); t.innerHTML = '<i class="fa-solid fa-circle-info"></i>' + esc(m); t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); };

  /* ---------- shared chrome ---------- */
  const nav = (icon, label, o = {}) => `<button class="nav-item ${o.on ? 'on' : ''}" ${o.go ? `data-go="${o.go}"` : `data-soon="${esc(label)}"`}><span class="ic"><i class="fa-solid fa-${icon}"></i></span>${label}</button>`;
  function renderSidebar(active) {
    sidebar.innerHTML = `
      <div class="brand"><img src="logo.svg" alt="">Backstage</div>
      <div class="sb-search"><label class="input"><i class="fa-solid fa-magnifying-glass"></i><input id="sbq" placeholder="Search..." autocomplete="off"></label></div>
      <nav class="nav">
        ${nav('book', 'DevSecOpedia')}
        <div class="nav-head">Catalog</div>
        ${nav('folder-open', 'My Projects', { go: '#/projects', on: active === 'projects' })}
        ${nav('robot', 'AI')}${nav('file-code', 'Libraries')}${nav('boxes-stacked', 'All')}
        <div class="nav-head">Self-Service Templates</div>
        ${nav('rocket', 'Patterns')}${nav('chart-pie', 'Data Science')}
        ${nav('forward', 'Actions', { go: '#/templates', on: active === 'templates' })}
        ${nav('clock-rotate-left', 'History')}
      </nav>
      <div class="sb-grow"></div>
      <div class="sb-foot">
        <button class="nav-item" data-soon="Help"><span class="ic"><i class="fa-regular fa-circle-question"></i></span>Help</button>
        <hr>
        <button class="user" data-soon="Profile"><span class="avatar"><img src="../portrait.png" alt=""></span><span class="who"><b>Jiri Sindelar</b><small>jiri.sin@gmail.com</small></span><i class="fa-solid fa-chevron-right"></i></button>
      </div>`;
  }
  const home = '<a class="homebtn" href="#/templates" title="Home"><i class="fa-solid fa-house-chimney-medical"></i></a>';
  const sep = '<i class="fa-solid fa-angle-right sep"></i>';
  const help = '<button class="btn" data-soon="Help"><i class="fa-solid fa-circle-question" style="font-size:16px"></i>Help</button>';
  const topbar = (left, right = '') => `<div class="topbar"><div class="crumbs">${left}</div><div class="actions">${right}${help}</div></div><div class="divider"></div>`;

  /* ---------- templates list ---------- */
  function tcard(t) {
    const star = isStar(t.id), open = F.open[t.id];
    const badges = `<div class="tbadges"><span class="chip-type" style="background:${TINT[t.type]}">${t.type}</span>${t.icons.map((i) => `<span class="tbadge"><i class="fa-solid fa-${i}"></i></span>`).join('')}</div>`;
    return `<article class="card tcard" style="--tint:${TINT[t.type]}">
      <div class="thead">${badges}<button class="tstar ${star ? 'on' : ''}" data-star="${t.id}" aria-label="${star ? 'Unstar' : 'Star'}" title="${star ? 'Unstar' : 'Star'}"><i class="${star ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>
        <h4>${esc(t.title)}</h4><div class="by">by <u>${esc(t.owner)}</u></div></div>
      <div class="tbody"><p><b>tl;dr;</b> ${esc(t.tldr)}</p>
        <div><h5>Details what this template will do:</h5><ol>${(open ? STEPS : STEPS.slice(0, 1)).map((s, i) => `<li>${i + 1}. ${esc(s)}</li>`).join('')}</ol></div></div>
      <div class="tfoot"><button class="btn btn-o" data-info="${t.id}"><i class="fa-solid fa-circle-info"></i>${open ? 'Less' : 'Info'}</button><button class="btn btn-s" data-use="${t.id}">Use</button></div>
    </article>`;
  }
  const matches = (t) => (F.type === 'All' || t.type === F.type) && (F.owner === 'All' || t.owner === F.owner) && (!F.q || (t.title + ' ' + t.owner).toLowerCase().includes(F.q.toLowerCase()));
  function templateSections() {
    const secs = [];
    if (F.cat === 'Starred') secs.push(['Starred', TEMPLATES.filter((t) => isStar(t.id) && matches(t))]);
    CATS.forEach((c, i) => { if (F.cat === 'Starred' || F.cat === c) secs.push([c, TEMPLATES.filter((t) => t.cat === i && matches(t))]); });
    const shown = secs.filter(([, l]) => l.length);
    if (!shown.length) return '<div class="empty">No templates match your filters.</div>';
    return shown.map(([h, l]) => `<section class="sec"><h2>${esc(h)}</h2><div class="grid">${l.map(tcard).join('')}</div></section>`).join('');
  }
  const sel = (id, label, opts, val) => `<div class="select"><select id="${id}" aria-label="${label}">${['All', ...opts].map((o) => `<option ${o === val ? 'selected' : ''} value="${esc(o)}">${label}: ${esc(o)}</option>`).join('')}</select><i class="fa-solid fa-chevron-down"></i></div>`;
  function viewTemplates() {
    renderSidebar('templates');
    main.innerHTML = topbar(`${home}${sep}<span>Self-Service Templates</span>${sep}<span class="cur">Actions</span>`,
      '<button class="btn btn-g" data-soon="More actions" aria-label="More"><i class="fa-solid fa-ellipsis-vertical"></i></button><button class="btn btn-p" data-soon="Add template"><i class="fa-solid fa-plus"></i>Add</button>')
      + `<div class="split page">
        <aside class="leftcol">
          <div class="card filterbox"><label class="input"><i class="fa-solid fa-magnifying-glass"></i><input id="tq" placeholder="Search templates..." value="${esc(F.q)}" autocomplete="off"></label>
            ${sel('ftype', 'Type', TYPES, F.type)}${sel('fowner', 'Owner', OWNERS, F.owner)}</div>
          <div class="catblock"><h3>Categories</h3><div class="card catlist">${['Starred', ...CATS].map((c) => `<button class="cat ${c === F.cat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
        </aside>
        <div class="content" id="tcontent">${templateSections()}</div></div>`;
  }
  const refreshTemplates = () => { $('#tcontent').innerHTML = templateSections(); };

  /* ---------- use template wizard ---------- */
  const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const TOPICS = ['Writing Templates', 'Input Examples', 'Builtin Actions', 'Writing Custom Actions', 'Adding Your Own Templates'];
  const WSTEPS = ['Answer some questions', 'Choose a location', 'Review'];
  function wizStep1() {
    return `<div class="form">
      <div class="field"><label for="w-name">What is your name? <span class="req">*</span></label><div class="input ${W.err ? 'err' : ''}"><input id="w-name" placeholder="Your Name" value="${esc(W.name)}" autocomplete="off"></div>${W.err ? '<div class="hint err">Please enter your name to continue.</div>' : ''}</div>
      <div class="field"><div class="lbl">What do you prefer: Light or Dark mode?</div><div class="opts">${['Light', 'Dark'].map((m) => `<label class="opt"><input type="radio" name="mode" value="${m}" ${W.mode === m ? 'checked' : ''}>${m}</label>`).join('')}</div></div>
      <div class="field"><div class="lbl">What Software Template topics are you interested in? <span>(optional)</span></div><div class="opts">${TOPICS.map((t) => `<label class="opt"><input type="checkbox" name="topic" value="${esc(t)}" ${W.topics.includes(t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div></div></div>`;
  }
  function wizStep2() {
    return `<div class="form">
      <div class="field"><label for="w-host">Host</label><div class="select"><select id="w-host">${['github.com', 'github.company.com'].map((h) => `<option ${W.host === h ? 'selected' : ''}>${h}</option>`).join('')}</select><i class="fa-solid fa-chevron-down"></i></div><div class="hint">The GitHub instance the repository is created on.</div></div>
      <div class="field"><label for="w-owner">Owner</label><div class="input"><input id="w-owner" value="${esc(W.owner)}" autocomplete="off"></div></div>
      <div class="field"><label for="w-repo">Repository <span class="req">*</span></label><div class="input ${W.err ? 'err' : ''}"><input id="w-repo" value="${esc(W.repo)}" autocomplete="off"></div>${W.err ? '<div class="hint err">Repository name is required.</div>' : ''}</div></div>`;
  }
  function wizStep3() {
    const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
    return `<div class="review card"><dl>${row('Name', esc(W.name))}${row('Colour mode', esc(W.mode || '—'))}${row('Topics', W.topics.length ? esc(W.topics.join(', ')) : '—')}${row('Location', `${esc(W.host)}/${esc(W.owner)}/${esc(W.repo)}`)}</dl></div>`;
  }
  function wizDone() {
    return `<div class="done-box"><div class="big"><i class="fa-solid fa-check"></i></div><h2>Template run finished</h2>
      <p>The repository <b>${esc(W.owner)}/${esc(W.repo)}</b> was created and the landing page is being deployed to GitHub Pages.</p>
      <div class="acts"><button class="btn btn-o" data-soon="Repository link">Open repository</button><button class="btn btn-s" data-go="#/templates">Back to templates</button></div></div>`;
  }
  function viewUse(id) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) { location.hash = '#/templates'; return; }
    if (!W || W.id !== id) W = { id, step: 0, name: '', mode: '', topics: [], host: 'github.com', owner: 'unicorn-team', repo: '', err: false, done: false };
    renderSidebar('templates');
    const body = W.done ? wizDone() : [wizStep1, wizStep2, wizStep3][W.step]();
    const stepper = `<div class="stepper">${WSTEPS.map((s, i) => `<div class="step ${W.done || i < W.step ? 'done' : i === W.step ? 'on' : ''}"><span class="dot">${W.done || i < W.step ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>${s}</div>`).join('')}</div>`;
    main.innerHTML = topbar(`${home}${sep}<span>Self-Service Templates</span>${sep}<a href="#/templates">Actions</a>${sep}<span class="chip-type" style="background:${TINT[t.type]}">${t.type}</span><span class="ttl">${esc(t.title)}</span>`)
      + `<div class="wiz page"><div class="card wizcard">
        <div class="wh"><h1>${esc(t.title)}</h1><p><b>tl;dr;</b> ${esc(t.tldr)}</p></div>
        <div class="wb">${W.done ? '' : stepper}${body}</div>
        ${W.done ? '' : `<div class="wf">${W.step ? '<button class="btn btn-o" data-wback>Back</button>' : '<span></span>'}<button class="btn btn-s" data-wnext>${W.step === 2 ? 'Create' : 'Next'}</button></div>`}
      </div></div>`;
    const first = $(W.step === 0 ? '#w-name' : W.step === 1 ? '#w-repo' : null);
    if (first && W.err) first.focus();
  }
  function wizNext() {
    if (W.step === 0) { W.err = !W.name.trim(); if (!W.err) { W.step = 1; if (!W.repo) W.repo = slug(W.name) + '-landing'; } }
    else if (W.step === 1) { W.err = !W.repo.trim(); if (!W.err) W.step = 2; }
    else { W.done = true; }
    viewUse(W.id);
  }

  /* ---------- projects ---------- */
  function viewProjects() {
    renderSidebar('projects');
    main.innerHTML = topbar(`${home}<span class="cur">My Projects</span>`, '<button class="btn btn-p" data-soon="Add project"><i class="fa-solid fa-plus"></i>Add project</button>')
      + `<div class="projgrid page">${PROJECTS.map((p) => `<article class="card pcard" tabindex="0" role="link" data-open="${p.id}">
        <div class="phead"><h3>${esc(p.name)}</h3><small>${p.code}</small><i class="fa-solid fa-ellipsis-vertical" data-stop></i></div>
        <div class="pbody">${esc(p.desc)}</div>
        <div class="pfoot"><span class="chip"><i class="fa-solid fa-user-group"></i>${team[p.id].length}</span><span class="chip"><i class="fa-solid fa-cubes-stacked"></i>${p.components}</span></div></article>`).join('')}</div>`;
  }
  const TABS = [['overview', 'compass', 'Overview'], ['team', 'user-group', 'Team'], ['components', 'cubes-stacked', 'Components']];
  function viewProject(id, tab) {
    const p = PROJECTS.find((x) => x.id === id);
    if (!p) { location.hash = '#/projects'; return; }
    tab = TABS.some((t) => t[0] === tab) ? tab : 'team';
    renderSidebar('projects');
    let body;
    if (tab === 'team') {
      const rows = team[id].map((m, i) => `<tr><td><div class="who2"><span class="av"><i class="fa-solid fa-${m.icon}"></i></span>${esc(m.name)}</div></td><td>${esc(m.email)}</td><td class="role">${esc(m.role)}</td><td class="more"><button class="rowbtn" data-row="${i}" aria-label="Actions for ${esc(m.name)}"><i class="fa-solid fa-ellipsis"></i></button></td></tr>`).join('');
      const c = p.code, g = (s) => `${'dso-' + c}-${s}`;
      body = `<div class="teamgrid"><div class="card table-wrap" style="flex:1;min-width:0"><table class="table"><thead><tr><th style="width:240px">Name</th><th style="width:360px">Email</th><th>Role</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="side">
          <div class="card sidecard"><div class="sh"><b>Security groups</b><i class="fa-solid fa-users"></i></div><ul>${['admins', 'contributors', 'viewers'].map((s) => `<li>${g(s)}</li>`).join('')}</ul></div>
          <div class="card sidecard"><div class="sh"><b>GitHub Teams</b><i class="fa-brands fa-github"></i></div><ul class="link">${['admins', 'contributors', 'viewers'].map((s) => `<li><a href="#/projects/${id}/team" data-soon="GitHub team">${g(s)}</a></li>`).join('')}</ul></div>
          <div class="card sidecard"><div class="sh"><b>Distribution List</b><i class="fa-solid fa-envelope"></i></div><ul><li>${g('all')}</li></ul></div></div></div>`;
    } else {
      body = `<div class="placeholder"><i class="fa-solid fa-${TABS.find((t) => t[0] === tab)[1]}"></i>${SOON}. Open the Team tab to see the designed screen.</div>`;
    }
    main.innerHTML = topbar(`${home}<a href="#/projects">My Projects</a>${sep}<span class="cur">${esc(p.name)}</span>`)
      .replace('<div class="divider"></div>', '')
      + `<div class="pagehead"><h1>${esc(p.name)}</h1><button class="btn btn-g" data-soon="Project menu" aria-label="Project menu"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>
      <div class="tabs">${TABS.map(([k, ic, l]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/projects/${id}/${k}"><i class="fa-solid fa-${ic}"></i>${l}</a>`).join('')}</div><div class="divider"></div>
      <div class="page">${body}</div>`;
  }

  /* ---------- row menu ---------- */
  function closeMenu() { const m = $('.menu'); if (m) m.remove(); }
  function openMenu(btn, projId, idx) {
    closeMenu();
    const r = btn.getBoundingClientRect(), m = team[projId][idx];
    const el = document.createElement('div'); el.className = 'menu'; el.setAttribute('role', 'menu');
    el.innerHTML = `<button data-m="copy"><i class="fa-regular fa-copy"></i>Copy email</button><button data-m="remove" class="danger"><i class="fa-solid fa-user-minus"></i>Remove from project</button>`;
    document.body.appendChild(el);
    el.style.top = r.bottom + 4 + 'px'; el.style.left = Math.max(8, r.right - el.offsetWidth) + 'px';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      closeMenu();
      if (b.dataset.m === 'copy') { try { navigator.clipboard.writeText(m.email); } catch (err) {} toast('Copied ' + m.email); }
      else { team[projId].splice(idx, 1); toast(m.name + ' removed from the project'); route(); }
    });
  }

  /* ---------- router ---------- */
  function route() {
    closeMenu();
    const h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [a, b, c] = h;
    if (!a || a === 'templates') {
      if (b === 'use' && c) { viewUse(c); } else { W = null; viewTemplates(); }
    } else if (a === 'projects') { b ? viewProject(b, c) : viewProjects(); }
    else { location.hash = '#/templates'; return; }
    main.scrollTop = 0;
  }
  window.addEventListener('hashchange', route);

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t.closest('.menu') && !t.closest('[data-row]')) closeMenu();
    let el;
    if ((el = t.closest('[data-soon]'))) { e.preventDefault(); toast(el.dataset.soon + ' — ' + SOON.toLowerCase()); return; }
    if ((el = t.closest('[data-go]'))) { location.hash = el.dataset.go; return; }
    if ((el = t.closest('[data-star]'))) {
      const id = el.dataset.star; ST.starred = isStar(id) ? ST.starred.filter((x) => x !== id) : [...ST.starred, id]; save();
      toast(isStar(id) ? 'Added to Starred' : 'Removed from Starred'); refreshTemplates(); return;
    }
    if ((el = t.closest('[data-info]'))) { F.open[el.dataset.info] = !F.open[el.dataset.info]; refreshTemplates(); return; }
    if ((el = t.closest('[data-use]'))) { location.hash = '#/templates/use/' + el.dataset.use; return; }
    if ((el = t.closest('[data-cat]'))) { F.cat = el.dataset.cat; $$('.cat').forEach((c) => c.classList.toggle('on', c === el)); refreshTemplates(); return; }
    if ((el = t.closest('[data-wnext]'))) { wizNext(); return; }
    if ((el = t.closest('[data-wback]'))) { W.step = Math.max(0, W.step - 1); W.err = false; viewUse(W.id); return; }
    if (t.closest('[data-stop]')) { e.stopPropagation(); toast('Project menu — ' + SOON.toLowerCase()); return; }
    if ((el = t.closest('[data-open]'))) { location.hash = '#/projects/' + el.dataset.open + '/team'; return; }
    if ((el = t.closest('[data-row]'))) { openMenu(el, location.hash.split('/')[2], +el.dataset.row); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.pcard')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Enter' && e.target.matches('#w-name, #w-repo, #w-owner')) wizNext();
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'tq') { F.q = t.value; refreshTemplates(); }
    else if (t.id === 'w-name') { W.name = t.value; }
    else if (t.id === 'w-owner') { W.owner = t.value; }
    else if (t.id === 'w-repo') { W.repo = t.value; }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'ftype') { F.type = t.value; refreshTemplates(); }
    else if (t.id === 'fowner') { F.owner = t.value; refreshTemplates(); }
    else if (t.id === 'w-host') { W.host = t.value; }
    else if (t.name === 'mode') { W.mode = t.value; }
    else if (t.name === 'topic') { W.topics = $$('input[name=topic]:checked').map((c) => c.value); }
  });

  route();
})();
