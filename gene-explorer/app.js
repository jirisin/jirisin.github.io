/* Lattice prototype — views, routing, interactions. All data is fictional (see data.js). */
(function () {
  const D = DB;
  const { CATS, CAT, AXES, AXI, COLS, GENES, AREAS, DIS, UNIVERSE, GBYID, GENEGROUPS, context, rescore, geneScore, gscore, edgesOf, layoutOf, WHY, SIZE_NOTE, clamp } = D;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app'), tip = $('#tip');

  /* ---------- storage ---------- */
  const KEY = 'lattice-proto-v3';
  const DAY = 864e5;
  let ST = { inv: [] };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.inv) ST = o; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };
  const newInv = (o = {}) => ({ id: 'i' + Math.random().toString(36).slice(2, 8), name: '', area: null, disease: null, papers: [], w: { gen: 0.85, exp: 0.55, prot: 0.45, net: 0.5, tract: 0.7 }, minKnown: 3, favs: [], gfavs: [], notes: {}, archived: false, created: Date.now(), updated: Date.now(), ...o });
  const diseaseByName = (n) => Object.values(DIS).find((d) => d.name === n);
  function seed() {
    const mk = (n, days, k, nf, arch, gf) => {
      const d = diseaseByName(n);
      const inv = newInv({ name: n + ' investigation', area: d.area, disease: d.id, papers: d.papers.slice(0, k).map((p) => p.id), archived: !!arch, created: Date.now() - (days + 6) * DAY, updated: Date.now() - days * DAY });
      const c = context(inv); rescore(c, inv.w);
      const top = [...c.rows].filter((r) => r.nK >= 3).sort((a, b) => a.rank - b.rank)[0];
      if (top) [...top.members].sort((a, b) => gscore(c, top, b, inv.w) - gscore(c, top, a, inv.w)).slice(0, nf).forEach((s) => inv.favs.push({ s, g: top.id }));
      if (top && (gf || nf)) inv.gfavs.push(top.id);
      return inv;
    };
    ST.inv = [mk('Coronary artery disease', 1, 4, 5), mk('Type 2 diabetes', 6, 3, 0, false, true), mk('MASH / fatty liver', 24, 2, 0, true)];
    save();
  }
  if (!ST.inv.length) seed();

  /* ---------- current investigation ---------- */
  let cur = null, C = null, UI = {};
  const H = (tail = '') => (cur ? `#/i/${cur.id}/${tail}` : '#/');
  function enter(id) {
    const inv = ST.inv.find((x) => x.id === id); if (!inv) return false;
    if (cur !== inv) UI = { sizes: ['cap', 'mid', 'low', 'tiny'], cats: CATS.map((c) => c.id), min: 0, q: '', favOnly: false, sort: 'score', view: 'list', cmp: null };
    cur = inv; C = context(inv); rescore(C, inv.w); return true;
  }
  const touch = () => { cur.updated = Date.now(); save(); };

  /* ---------- helpers ---------- */
  const I = {
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    fwd: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    dl: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
    share: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  };
  const pct = (v) => Math.round(v * 100);
  const gp = (v) => clamp((v - 0.25) / 0.55);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m) => { const t = $('#toast'); t.innerHTML = '<i></i>' + m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); };
  const rel = (ts) => { const d = Math.round((Date.now() - ts) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 14 ? d + ' days ago' : Math.round(d / 7) + ' weeks ago'; };
  const isFav = (s) => cur.favs.some((f) => f.s === s);
  const favBtn = (s, g, cls = '') => `<button class="pinb fav ${cls} ${isFav(s) ? 'on' : ''}" data-fav="${s}" data-fg="${g || ''}" title="Favourite">${I.star}</button>`;
  const ge = (s) => C.eff(s);
  const gs = (row, s) => gscore(C, row, s, cur.w);
  const catOf = (s) => CATS[ge(s).catScore.indexOf(Math.max(...ge(s).catScore))];
  const sizeBucket = (n) => (n === 100 ? 'cap' : n >= 50 ? 'mid' : n >= 10 ? 'low' : 'tiny');
  const rankedGenes = (row) => [...row.members].sort((a, b) => gs(row, b) - gs(row, a));
  const isGFav = (id) => (cur.gfavs || []).includes(id);
  const gfavBtn = (id, cls = '') => `<button class="pinb fav gfav ${cls} ${isGFav(id) ? 'on' : ''}" data-gfav="${id}" title="Favourite gene group">${I.star}</button>`;
  const favCount = (row) => cur.favs.filter((f) => row.g.members.includes(f.s)).length;
  const rowOfFav = (f) => C.by[f.g] || C.by[(GENEGROUPS[f.s] || [])[0]];
  const diseaseName = () => (cur.disease ? DIS[cur.disease].name : '');

  /* ---------- blob radar ---------- */
  function blobPath(p) {
    const n = p.length; let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
      d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  const PAL = { c: { f: 'rgba(76,198,226,.46)', s: '#168aa6', d: '#4cc6e2' }, a: { f: 'rgba(245,166,60,.30)', s: '#e8921a', d: '#f5a63c' } };
  function radar({ series, mini = false, labels = true, w = null }) {
    const n = AXES.length, R = mini ? 40 : 150, vb = mini ? '-50 -50 100 100' : '-290 -245 580 490';
    const ang = (i) => ((-90 + (i * 360) / n) * Math.PI) / 180;
    let o = `<svg class="radar" viewBox="${vb}" ${mini ? 'width="76" height="76"' : 'width="100%"'} role="img">`;
    if (!mini) {
      [1 / 3, 2 / 3, 1].forEach((k) => (o += `<circle r="${R * k}" fill="none" stroke="#dfe2ea" stroke-dasharray="4 5"/>`));
      o += `<circle r="${R * 1.3}" fill="none" stroke="#eef0f4"/>`;
      AXES.forEach((a, i) => {
        const x = Math.cos(ang(i)), y = Math.sin(ang(i));
        o += `<line x1="${x * 22}" y1="${y * 22}" x2="${x * R * 1.05}" y2="${y * R * 1.05}" stroke="#dcdfe7"/>`;
        if (labels) {
          const parts = a.name.split(' '), l1 = parts.length > 1 ? parts.slice(0, Math.ceil(parts.length / 2)).join(' ') : a.name, l2 = parts.length > 1 ? parts.slice(Math.ceil(parts.length / 2)).join(' ') : '';
          const anc = Math.abs(x) < 0.2 ? 'middle' : x > 0 ? 'start' : 'end', col = w ? CAT[a.cat].dark : '#5a5f7a';
          o += `<text x="${(x * (R + 30)).toFixed(0)}" y="${(y * (R + 30) - (l2 ? 6 : -4)).toFixed(0)}" text-anchor="${anc}" font-size="13" fill="${col}" font-weight="500">${l1}${l2 ? `<tspan x="${(x * (R + 30)).toFixed(0)}" dy="16">${l2}</tspan>` : ''}</text>`;
        }
      });
    } else o += `<circle r="${R}" fill="none" stroke="#eceef3" stroke-dasharray="2 3"/><circle r="${R * 0.55}" fill="none" stroke="#f0f1f5"/>`;
    series.forEach((s, si) => {
      const pal = PAL[s.k];
      const pts = s.vals.map((v, i) => { const r = R * (0.14 + 0.86 * clamp(v)); return [Math.cos(ang(i)) * r, Math.sin(ang(i)) * r]; });
      o += `<g class="blob" style="animation-delay:${si * 80}ms"><path d="${blobPath(pts)}" fill="${pal.f}" stroke="${pal.s}" stroke-width="${mini ? 1.4 : 2}" stroke-linejoin="round"/>`;
      if (!mini) {
        pts.forEach((p) => (o += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="#fff" stroke="${pal.s}" stroke-width="2"/>`));
        if (si === 0) {
          const mi = s.vals.indexOf(Math.max(...s.vals));
          o += `<circle cx="${pts[mi][0]}" cy="${pts[mi][1]}" r="13" fill="${pal.d}" fill-opacity=".25" stroke="${pal.s}" stroke-width="1.5"/><circle cx="${pts[mi][0]}" cy="${pts[mi][1]}" r="5.5" fill="#fff" stroke="${pal.s}" stroke-width="2"/>`;
          o += `<text x="${pts[mi][0] + (pts[mi][0] >= 0 ? 20 : -20)}" y="${pts[mi][1] + 7}" text-anchor="${pts[mi][0] >= 0 ? 'start' : 'end'}" font-size="21" fill="#1f2240" font-weight="500">${pct(s.vals[mi])}</text>`;
        }
      }
      o += '</g>';
    });
    if (!mini) o += `<circle r="18" fill="#4cc6e2" stroke="#168aa6" stroke-width="2.5"/><circle r="8" fill="#fff"/>`;
    return o + '</svg>';
  }
  const miniRadar = (vals) => radar({ series: [{ vals: vals.map(gp), k: 'c' }], mini: true, labels: false });

  /* ---------- tooltip ---------- */
  document.addEventListener('mousemove', (e) => { if (!tip.classList.contains('on')) return; tip.style.left = Math.min(e.clientX + 18, innerWidth - 300) + 'px'; tip.style.top = Math.min(e.clientY + 18, innerHeight - 160) + 'px'; });
  const showTip = (h) => { tip.innerHTML = h; tip.classList.add('on'); };
  const hideTip = () => tip.classList.remove('on');

  /* ---------- nav ---------- */
  function nav(p) {
    const on = !cur ? 'home' : p[2] === 'shortlist' ? 'short' : p[2] === 'define' ? 'inv' : 'groups';
    const off = 'class="dis" title="Select an investigation first"';
    const opts = ST.inv.filter((i) => !i.archived && (i.disease || i === cur));
    const sel = `<select id="invsel">${cur ? '' : '<option value="" selected disabled>Select…</option>'}${opts.map((i) => `<option value="${i.id}" ${cur && cur.id === i.id ? 'selected' : ''}>${esc(i.name || 'Untitled investigation')}</option>`).join('')}</select>`;
    $('#steps').innerHTML = `<div class="invm ${on === 'inv' ? 'on' : ''}">${cur ? `<a href="${H('define')}" title="Investigation setup">Investigation:</a>` : '<span class="dis-l">Investigation:</span>'}${sel}</div>`
      + (cur
        ? `<a href="${H('groups')}" class="${on === 'groups' ? 'on' : ''}">Gene groups</a><a href="${H('shortlist')}" class="${on === 'short' ? 'on' : ''}">Short lists <span class="badge" id="badge">${cur.favs.length + (cur.gfavs || []).length}</span></a>`
        : `<span ${off}>Gene groups</span><span ${off}>Short lists</span>`);
    $('#invsel').onchange = (e) => { const sec = !cur ? 'groups' : p[2] === 'shortlist' ? 'shortlist' : p[2] === 'define' ? 'define' : 'groups'; location.hash = '#/i/' + e.target.value + '/' + sec; };
  }
  const updBadge = () => { const b = $('#badge'); if (b) b.textContent = cur.favs.length + (cur.gfavs || []).length; };

  /* ================= HOME ================= */
  function relevantGroups(inv) { const c = context(inv); rescore(c, inv.w); return c.rows.filter((r) => r.nK >= inv.minKnown).length; }
  function pageHome() {
    ST.inv = ST.inv.filter((i) => i.disease); save();
    const act = ST.inv.filter((i) => !i.archived).sort((a, b) => b.updated - a.updated), arc = ST.inv.filter((i) => i.archived);
    const card = (i) => {
      const d = DIS[i.disease], a = AREAS.find((x) => x.id === i.area), c = context(i), stage = i.archived ? 4 : i.favs.length ? 3 : (i.gfavs || []).length ? 2 : 1, STG = ['Investigation set up', 'Gene group favourited', 'Gene favourited', 'Archived'];
      return `<article class="pcard ${i.archived ? 'arch' : ''}" data-open="${i.id}">
        <div class="ptop"><span class="kick"><span class="ring" style="--c:#4cc6e2"></span>${a ? a.name : ''}</span>${i.archived ? '<span class="gchip">Archived</span>' : ''}</div>
        <h3>${esc(i.name || d.name)}</h3><div class="pdis">${d.name}</div>
        <div class="pmeta"><div><b>${i.papers.length}</b><small>papers</small></div><div><b>${c.K.size}</b><small>known genes</small></div><div><b class="amb">${i.favs.length + (i.gfavs || []).length}</b><small>favourited</small></div></div>
        <div class="stage"><div class="pbar"><i style="width:${stage * 25}%"></i></div><span>${stage}/4 · ${STG[stage - 1]}</span></div>
        <div class="pfoot"><span>Edited ${rel(i.updated)}</span><button class="lnk" data-arch="${i.id}">${i.archived ? 'Restore' : 'Archive'}</button></div></article>`;
    };
    app.innerHTML = `<div class="hero page"><div class="hwrap">
      <h1 class="hh">Find the next gene<br>worth researching</h1>
      <div class="hrow"><h2 class="hsub">Your investigations</h2>${arc.length ? `<button class="hbtn" id="tarch">${UI.showArch ? 'Hide' : 'Show'} archived <span>${arc.length}</span></button>` : ''}</div>
      <div class="pgrid"><article class="pcard newc" data-new><span class="plus">${I.plus}</span><b>Start a new investigation</b><small>Choose a disease and the papers you trust</small></article>${act.map(card).join('')}</div>
      ${arc.length && UI.showArch ? `<h3 class="archh">Archived</h3><div class="pgrid">${arc.map(card).join('')}</div>` : ''}
    </div></div>`;
    $('#tarch') && ($('#tarch').onclick = () => { UI.showArch = !UI.showArch; pageHome(); });
    requestAnimationFrame(layoutHero); setTimeout(layoutHero, 250);
  }

  /* blueprint hero: a blue field with a diagonal edge that crosses the top third of the first card */
  function layoutHero() {
    const hero = $('.hero'), card = $('.newc'); if (!hero || !card) return;
    const W = hero.offsetWidth, tan = 0.55, cw = card.offsetWidth, ch = card.offsetHeight, wrap = $('.hwrap'), cl = card.offsetLeft + wrap.offsetLeft, ct = card.offsetTop + wrap.offsetTop;
    const yl = ch * 0.7;                                   // edge height inside the card at its left side
    const y0 = ct + yl + tan * cl, H = Math.round(y0 + 70); // edge height at x = 0
    const ey = (x) => y0 - tan * x;
    card.style.setProperty('--c-l', yl.toFixed(1) + 'px'); card.style.setProperty('--c-r', (yl - tan * cw).toFixed(1) + 'px');
    const bg = $('#bluebg'), E = ey(W), set = (k, v) => bg.style.setProperty(k, Math.round(v) + 'px');
    set('--el', y0); set('--er', E); set('--s1', y0 - 16); set('--s2', E - 16); set('--s3', E); set('--s4', y0);
    bg.style.height = Math.ceil(y0 + 2) + 'px';
  }
  addEventListener('resize', () => requestAnimationFrame(layoutHero));
  document.fonts && document.fonts.ready.then(() => requestAnimationFrame(layoutHero));

  /* ================= DEFINE ================= */
  function pageDefine() {
    app.innerHTML = `<div class="page">
      <div class="eyebrow"><i></i>Investigation setup</div>
      <input class="titlein" id="iname" placeholder="Untitled investigation" value="${esc(cur.name)}" maxlength="60">
      <div class="def"><div id="left"></div><aside class="card preview" id="pv"></aside></div></div>`;
    $('#iname').oninput = (e) => { cur.name = e.target.value; touch(); const o = $('#invsel option:checked'); if (o) o.textContent = cur.name || 'Untitled investigation'; };
    const papers = () => (cur.disease ? DIS[cur.disease].papers : []);
    const sel = (id) => cur.papers.includes(id);
    function draw() {
      const area = AREAS.find((a) => a.id === cur.area);
      const ps = [...papers()].sort({ genes: (a, b) => b.genes.length - a.genes.length, year: (a, b) => b.year - a.year, cites: (a, b) => b.cites - a.cites }[UI.psort || 'genes']);
      $('#left').innerHTML = `
        <section class="sect"><h2><b>1</b>Therapeutic area</h2><p>The broad field you are working in.</p>
          <div class="body acards">${AREAS.map((a) => `<button class="acard ${cur.area === a.id ? 'on' : ''}" data-area="${a.id}"><span class="ring" style="--c:#4cc6e2"></span><b>${a.name}</b><small>${a.diseases.length} diseases</small></button>`).join('')}</div></section>
        <section class="sect ${area ? '' : 'locked'}"><h2><b>2</b>Disease</h2><p>${area ? 'The specific disease to find genes for.' : 'Choose a therapeutic area first.'}</p>
          <div class="body dcards">${area ? area.diseases.map((d) => `<button class="dcard ${cur.disease === d.id ? 'on' : ''}" data-dis="${d.id}"><b>${d.name}</b><small>${d.papers.length} papers · ${new Set(d.papers.flatMap((p) => p.genes)).size} genes linked</small></button>`).join('') : ''}</div></section>
        <section class="sect ${cur.disease ? '' : 'locked'}"><h2><b>3</b>Research papers</h2><p>${cur.disease ? 'Genes linked to the disease by the papers you tick become the known genes. Fictional papers.' : 'Choose a disease first.'}</p>
          <div class="body">${cur.disease ? `<div class="ptool"><span class="muted"><b style="font-weight:600;color:var(--ink)">${cur.papers.length}</b> of ${ps.length} selected</span><span class="sp"></span><button class="lnk" data-psel="all">Select all</button><button class="lnk" data-psel="rec">Recommended</button><button class="lnk" data-psel="none">Clear</button>
            <select id="psort"><option value="genes">Most genes linked</option><option value="year">Newest</option><option value="cites">Most cited</option></select></div>
            <div class="plist">${ps.map((p) => `<label class="pp ${sel(p.id) ? 'on' : ''}"><input type="checkbox" data-paper="${p.id}" ${sel(p.id) ? 'checked' : ''}><span class="bx"></span>
              <span class="ptx"><b>${p.title}</b><small>${p.authors} · ${p.journal} · ${p.year}${p.recommended ? ' · <span class="rec">Recommended</span>' : ''}</small><span class="pg">${p.genes.slice(0, 6).map((g) => `<span class="gchip">${g}</span>`).join('')}${p.genes.length > 6 ? `<span class="gchip more">+${p.genes.length - 6}</span>` : ''}</span></span>
              <span class="ptype"><span class="pill expl">${p.type}</span></span><span class="pnum"><b>${p.genes.length}</b><small>genes</small></span></label>`).join('')}</div>` : ''}</div></section>
        <button class="btn pri" id="run" ${cur.disease && cur.papers.length ? '' : 'disabled'} style="margin-left:0">${UI.visited ? 'Update gene groups' : 'Find gene groups'} ${I.fwd}</button>`;
      if ($('#psort')) $('#psort').value = UI.psort || 'genes';
      pv();
    }
    function pv() {
      const c = context(cur); rescore(c, cur.w); const n = c.rows.filter((r) => r.nK >= cur.minKnown).length;
      $('#pv').innerHTML = `<div class="rad">${radar({ series: [{ vals: AXES.map((a) => cur.w[a.cat] * 0.9 + 0.1), k: 'c' }], w: true })}</div>
        <div class="two"><div><div class="big">${c.K.size}</div><div class="sub">known genes</div></div><div><div class="big amb">${cur.disease ? n : '–'}</div><div class="sub">gene groups<br>to explore</div></div></div>
        <div class="cap-note"><span class="ring" style="--c:#4cc6e2"></span><span>${cur.disease ? `Gene groups are fixed — the same <b style="font-weight:500;color:var(--ink)">${UNIVERSE.length}</b> for everyone. Your papers decide which ones light up.` : 'Choose a disease and papers to see how many gene groups are relevant.'}</span></div>`;
    }
    draw();
    $('#left').onclick = (e) => {
      const a = e.target.closest('[data-area]'), d = e.target.closest('[data-dis]'), s = e.target.closest('[data-psel]');
      if (a) { cur.area = a.dataset.area; if (cur.disease && DIS[cur.disease].area !== cur.area) { cur.disease = null; cur.papers = []; } touch(); draw(); }
      else if (d) { cur.disease = d.dataset.dis; cur.papers = DIS[cur.disease].papers.filter((p) => p.recommended).map((p) => p.id); if (!cur.name) { cur.name = DIS[cur.disease].name + ' investigation'; $('#iname').value = cur.name; const o = $('#invsel option:checked'); if (o) o.textContent = cur.name; } touch(); draw(); }
      else if (s) { const all = papers(); cur.papers = s.dataset.psel === 'all' ? all.map((p) => p.id) : s.dataset.psel === 'rec' ? all.filter((p) => p.recommended).map((p) => p.id) : []; touch(); draw(); }
      else if (e.target.closest('#run') && !e.target.closest('#run').disabled) runSearch();
    };
    $('#left').onchange = (e) => {
      if (e.target.dataset.paper) { const id = e.target.dataset.paper; cur.papers = e.target.checked ? [...cur.papers, id] : cur.papers.filter((x) => x !== id); touch(); draw(); }
      else if (e.target.id === 'psort') { UI.psort = e.target.value; draw(); }
    };
  }
  function runSearch() {
    UI.visited = true;
    const msgs = ['Matching known genes from your papers…', 'Scoring ' + UNIVERSE.length + ' gene groups…', 'Weighing genetics, expression and proteomics…', 'Ranking groups for ' + diseaseName() + '…'];
    app.innerHTML = `<div class="loading"><div><div class="pulse"><i></i><i></i><i></i><b></b></div><p id="lm">${msgs[0]}</p></div></div>`;
    let i = 0; const iv = setInterval(() => { i++; if (msgs[i]) $('#lm').textContent = msgs[i]; }, 560);
    setTimeout(() => { clearInterval(iv); location.hash = H('groups'); }, 2300);
  }

  /* ================= GROUP LIST ================= */
  function filtered() {
    const f = UI, q = f.q.trim().toUpperCase();
    const key = { score: (g) => -g.score, size: (g) => -g.size, cohesion: (g) => -g.cohesion, known: (g) => -g.nK, enr: (g) => -g.enr, novel: (g) => -g.novel }[f.sort];
    return C.rows.filter((g) => g.nK >= cur.minKnown && f.sizes.includes(sizeBucket(g.size)) && f.cats.includes(g.dom) && g.score >= f.min && (!q || g.id.includes(q) || g.members.some((m) => m.startsWith(q))) && (!f.favOnly || favCount(g) > 0)).sort((a, b) => key(a) - key(b));
  }
  function groupRow(g, i, q) {
    const rg = rankedGenes(g), hits = q ? g.members.filter((m) => m.startsWith(q)).slice(0, 3) : [];
    const chips = [...hits, ...rg.filter((m) => !hits.includes(m)).slice(0, 5 - hits.length)].map((m) => `<span class="gchip ${hits.includes(m) ? 'hit' : C.K.has(m) ? 'kn' : ''}">${m}</span>`);
    const fc = favCount(g);
    return `<div class="gr" data-go="${H('group/' + g.id)}" style="animation-delay:${Math.min(i, 12) * 40}ms">
      <div class="rk">${g.rank}</div>
      <div><div class="gname">${g.id} <span class="gchip lab">${g.label}</span></div><div class="gwhy">${WHY(C, g)}</div><div class="gchips">${chips.join('')}<span class="gchip more">+${g.size - chips.length}</span></div></div>
      <div class="gsize"><b>${g.size}</b> genes<div class="bar2 ${g.size === 100 ? '' : 'am'}"><i style="width:${g.size}%"></i><u></u></div><small>${g.size === 100 ? 'at the 100 cap' : g.size + '% of cap'}</small></div>
      <div class="gsize"><b class="cy">${g.nK}</b> known<div class="bar2"><i style="width:${clamp(g.nK / 12) * 100}%"></i></div><small>${g.enr.toFixed(1)}× expected</small></div>
      <div>${miniRadar(g.prof)}</div>
      <div><div class="gscore">${g.score}</div><div class="bar2" style="width:84px"><i style="width:${g.score}%"></i></div></div>
      <div class="gstat"><b>${g.cohesion.toFixed(2)}</b><small>cohesion</small></div>
      <div class="gstat">${gfavBtn(g.id)}<small>${fc ? fc + ' gene' + (fc > 1 ? 's' : '') : 'favourite'}</small></div>
      <div class="chev">${I.fwd}</div></div>`;
  }
  function landscape(list) {
    const W = 1000, H2 = 620, L = 70, Rr = 50, T = 50, B = 70;
    const X = (v) => L + ((v - 0.4) / 0.6) * (W - L - Rr), Y = (v) => T + (1 - (v - 36) / 64) * (H2 - T - B);
    const pts = list.map((g) => ({ g, x: X(g.cohesion), y: Y(g.score), r: 7 + Math.sqrt(g.size) * 0.9 }));
    for (let it = 0; it < 120; it++) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.1, min = a.r + b.r + 8; if (d < min) { const f = (min - d) / 2 / d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; } }
    pts.forEach((p) => { p.x = Math.max(L + p.r, Math.min(W - Rr - p.r, p.x)); p.y = Math.max(T + p.r, Math.min(H2 - B - p.r, p.y)); });
    const P = Object.fromEntries(pts.map((p) => [p.g.id, p]));
    let o = `<svg viewBox="0 0 ${W} ${H2}"><g stroke="#e6e8ee" fill="none"><line x1="${L}" y1="${Y(68)}" x2="${W - Rr}" y2="${Y(68)}"/><line x1="${X(0.7)}" y1="${T}" x2="${X(0.7)}" y2="${H2 - B}"/></g>
      <g font-size="13" fill="#6c7290"><text x="${L}" y="${Y(68) + 22}">Low cohesion</text><text x="${W - Rr}" y="${Y(68) + 22}" text-anchor="end">High cohesion</text><text x="${X(0.7) + 12}" y="${T + 6}">Higher score</text><text x="${X(0.7) + 12}" y="${H2 - B + 4}">Lower score</text></g>`;
    const pairs = [], top = list.slice(0, 40);
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j], sb = new Set(b.members), ov = a.members.filter((m) => sb.has(m)).length / Math.min(a.size, b.size), d = Math.hypot(P[a.id].x - P[b.id].x, P[a.id].y - P[b.id].y); if (ov > 0.1 && d < 230) pairs.push([a, b, ov]); }
    pairs.sort((a, b) => b[2] - a[2]).slice(0, 24).forEach(([a, b]) => (o += `<line x1="${P[a.id].x}" y1="${P[a.id].y}" x2="${P[b.id].x}" y2="${P[b.id].y}" stroke="${CAT[a.dom].color}" stroke-dasharray="3 4" stroke-opacity=".7"/>`));
    pts.slice().sort((a, b) => b.g.size - a.g.size).forEach(({ g, x, y, r }) => {
      const c = CAT[g.dom];
      o += `<g class="pt" data-go="${H('group/' + g.id)}" data-gid="${g.id}"><circle class="halo" cx="${x}" cy="${y}" r="${r + 7}" fill="${c.color}" fill-opacity=".14"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c.color}" fill-opacity=".55" stroke="${c.dark}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r * 0.38}" fill="#fff"/>`;
      if (g.rank <= 5) o += `<text x="${x}" y="${y + r + 17}" text-anchor="middle" font-size="12.5" fill="#1f2240" font-weight="500" paint-order="stroke" stroke="#fff" stroke-width="4">${g.id}</text>`;
      o += '</g>';
    });
    return o + '</svg>';
  }
  function pageGroups() {
    const f = UI, shown0 = C.rows.filter((g) => g.nK >= cur.minKnown);
    app.innerHTML = `<div class="page">
      <div class="ghead"><div><div class="eyebrow"><i></i>${esc(diseaseName())} · <a href="${H('define')}" style="text-decoration:underline">edit</a></div>
        <h1>Gene groups</h1>
        <p class="lede">Fixed groups of interacting genes, ranked by how rich they are in genes your ${cur.papers.length} selected paper${cur.papers.length === 1 ? '' : 's'} link to ${esc(diseaseName())}. The rest of each group are candidate targets.</p></div>
        <div class="kpis"><div class="kpi"><div class="n" id="k1">${shown0.length}</div><div class="l">relevant groups</div></div><div class="kpi"><div class="n">${C.K.size}</div><div class="l">known genes</div></div><div class="kpi"><div class="n amb">${cur.favs.length}</div><div class="l">favourited</div></div></div></div>
      <div class="gwrap"><aside class="rail">
        <div class="search">${I.search}<input id="q" placeholder="Group ID or gene, e.g. PCSK9" value="${esc(f.q)}" autocomplete="off"></div>
        <div><h3>Known genes ≥ <span id="mkv" class="num">${cur.minKnown}</span></h3><input type="range" min="1" max="10" value="${cur.minKnown}" id="mk" style="--p:${((cur.minKnown - 1) / 9) * 100}%"></div>
        <div><h3>Group size</h3>${[['cap', '100 genes (capped)'], ['mid', '50 – 99 genes'], ['low', '10 – 49 genes'], ['tiny', '5 – 9 genes']].map(([k, l]) => `<label class="ck"><input type="checkbox" data-size="${k}" ${f.sizes.includes(k) ? 'checked' : ''}><span class="bx"></span>${l}<span class="ct">${shown0.filter((g) => sizeBucket(g.size) === k).length}</span></label>`).join('')}</div>
        <div><h3>Strongest evidence</h3>${CATS.map((c) => `<label class="ck"><input type="checkbox" data-cat="${c.id}" ${f.cats.includes(c.id) ? 'checked' : ''}><span class="bx" style="--c:${c.color}"></span>${c.name}<span class="ct">${shown0.filter((g) => g.dom === c.id).length}</span></label>`).join('')}</div>
        <div><h3>Minimum score · <span id="minsv" class="num">${f.min}</span></h3><input type="range" min="0" max="90" step="5" value="${f.min}" id="mins" style="--p:${(f.min / 90) * 100}%"></div>
        <label class="ck"><input type="checkbox" id="fo" ${f.favOnly ? 'checked' : ''}><span class="bx" style="--c:#f5a63c"></span>With favourited genes</label>
      </aside><section><div class="toolbar"><div class="seg" id="view"><button data-v="list" class="${f.view === 'list' ? 'on' : ''}">List</button><button data-v="map" class="${f.view === 'map' ? 'on' : ''}">Landscape</button></div>
        <div style="display:flex;gap:12px;align-items:center"><span class="muted" id="shown"></span><select id="sort">${[['score', 'Sort: Score'], ['known', 'Sort: Known genes'], ['enr', 'Sort: Enrichment'], ['size', 'Sort: Group size'], ['cohesion', 'Sort: Cohesion'], ['novel', 'Sort: Understudied genes']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div id="gbody"></div></section></div></div>`;
    const draw = () => {
      const list = filtered(), q = f.q.trim().toUpperCase();
      $('#shown').textContent = `${list.length} of ${UNIVERSE.length} groups`;
      if (!list.length) { $('#gbody').innerHTML = `<div class="glist"><div class="empty">No gene groups match these filters.</div></div>`; return; }
      if (f.view === 'list') $('#gbody').innerHTML = `<div class="gh"><span>#</span><span>Gene group</span><span>Size</span><span>Known genes</span><span>Evidence</span><span>Score</span><span></span><span></span><span></span></div><div class="glist">${list.slice(0, 60).map((g, i) => groupRow(g, i, q)).join('')}${list.length > 60 ? `<div class="more60">Showing top 60 of ${list.length} — narrow with the filters</div>` : ''}</div>`;
      else $('#gbody').innerHTML = `<div class="land">${landscape(list.slice(0, 80))}<div class="lgd">${CATS.map((c) => `<span><span class="ring" style="--c:${c.color}"></span>${c.name}</span>`).join('')}<span class="faint">· ring size = gene count · dashed line = shared genes</span></div></div>`;
    };
    draw();
    $('#q').oninput = (e) => { f.q = e.target.value; draw(); };
    $$('[data-size]').forEach((c) => (c.onchange = () => { f.sizes = $$('[data-size]').filter((x) => x.checked).map((x) => x.dataset.size); draw(); }));
    $$('[data-cat]').forEach((c) => (c.onchange = () => { f.cats = $$('[data-cat]').filter((x) => x.checked).map((x) => x.dataset.cat); draw(); }));
    $('#mk').oninput = (e) => { cur.minKnown = +e.target.value; e.target.style.setProperty('--p', ((cur.minKnown - 1) / 9) * 100 + '%'); $('#mkv').textContent = cur.minKnown; $('#k1').textContent = C.rows.filter((g) => g.nK >= cur.minKnown).length; save(); draw(); };
    $('#mins').oninput = (e) => { f.min = +e.target.value; e.target.style.setProperty('--p', (f.min / 90) * 100 + '%'); $('#minsv').textContent = f.min; draw(); };
    $('#fo').onchange = (e) => { f.favOnly = e.target.checked; draw(); };
    $('#sort').onchange = (e) => { f.sort = e.target.value; draw(); };
    $('#view').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; f.view = b.dataset.v; $$('#view button').forEach((x) => x.classList.toggle('on', x === b)); draw(); };
    app.onmouseover = (e) => { const p = e.target.closest('.pt'); if (!p) return hideTip(); const g = C.by[p.dataset.gid]; showTip(`<b>${g.id}</b><div class="sub">${g.label} · ${SIZE_NOTE(g)}</div><div class="big">${g.score}</div><div class="muted">${g.nK} known genes · cohesion ${g.cohesion.toFixed(2)}</div>`); };
    app.onmouseleave = hideTip;
  }

  /* ================= GENE TABLE (shared by group genes + shortlist) ================= */
  let curRows = [];
  const catPills = (s) => CATS.map((c, k) => `<i style="--c:${c.color};--k:${Math.round(clamp(ge(s).catScore[k]) * 100)}%"></i>`).join('');
  function matrix(el, rows, o = {}) {
    curRows = rows;
    let h = '<table class="mt"><thead><tr><th class="gc cb"></th>';
    h += `<th class="cb" colspan="${o.group ? 5 : 4}"></th>`;
    CATS.forEach((c) => { const n = COLS.filter((x) => x.cat === c.id).length; h += `<th class="cb" colspan="${n}" style="--c:${c.color}"><span><i></i>${c.name}</span></th>`; });
    h += '</tr><tr><th class="gc ch" style="vertical-align:bottom"><div class="hz" style="padding-left:12px">Gene</div></th>';
    h += `<th class="ch exh"><div class="hz">Papers</div></th><th class="ch exh"><div class="hz">Closeness</div></th><th class="ch exh"><div class="hz">Score</div></th><th class="ch exh"><div class="hz">Evidence</div></th>${o.group ? '<th class="ch exh"><div class="hz">Group</div></th>' : ''}`;
    COLS.forEach((c, i) => (h += `<th class="ch ${i === 0 || COLS[i - 1].cat !== c.cat ? 'first' : ''}"><div>${c.name}</div></th>`));
    h += '</tr></thead><tbody>';
    rows.forEach((r, ri) => {
      const s = r.s, e = ge(s), sc = pct(gs(r.row, s)), px = C.prox(r.row, s);
      h += `<tr class="${e.known ? 'kn' : ''}"><td class="gc"><div class="gcell">${favBtn(s, r.row.id, 'xs')}<span class="i">${r.rk}</span><a href="${H('gene/' + s + '?g=' + r.row.id)}">${s}</a>${e.known ? '<span class="kd" title="Linked to the disease by your papers"></span>' : ''}</div></td>`;
      h += `<td class="ex"><b class="ppn">${e.known || '–'}</b></td><td class="ex"><div class="cl"><div class="bar2"><i style="width:${pct(px)}%"></i></div><span>${e.known ? '' : px.toFixed(2)}</span></div></td><td class="ex"><b class="sco">${sc}</b></td><td class="ex"><span class="pills">${catPills(s)}</span></td>`;
      if (o.group) h += `<td class="ex"><a class="gchip" href="${H('group/' + r.row.id)}">${r.row.id}</a></td>`;
      e.cells.forEach((c, ci) => { const f = ci === 0 || COLS[ci - 1].cat !== COLS[ci].cat; h += `<td class="${f ? 'first' : ''}" data-r="${ri}" data-c="${ci}">${c ? `<span class="mk ${c[1] < 0 ? 'd' : ''} ${c[2] ? 's' : ''}" style="--c:${CAT[COLS[ci].cat].color};--k:${Math.round(12 + c[0] * 88)}%"></span>` : '<span class="mk n"></span>'}</td>`; });
      h += '</tr>';
    });
    el.innerHTML = h + '</tbody></table>' + (rows.length ? '' : '<div class="empty">No genes match.</div>');
    el.onmouseover = (ev) => {
      const td = ev.target.closest('td[data-r]'); if (!td) return hideTip();
      const r = curRows[+td.dataset.r], col = COLS[+td.dataset.c], c = ge(r.s).cells[+td.dataset.c];
      showTip(`<b>${r.s}</b><div class="sub"><span class="ring" style="--c:${CAT[col.cat].color};width:10px;height:10px"></span> ${col.name}</div>` + (c ? `<div class="big">${(c[0] * 11).toFixed(1)}<span class="faint" style="font-size:13px"> −log₁₀p</span></div><div class="muted">${c[1] > 0 ? 'Raises' : 'Lowers'} · magnitude ${pct(c[0])}% · ${c[2] ? 'significant' : 'suggestive only'}</div>` : '<div class="muted">No data for this gene</div>'));
    };
    el.onmouseleave = hideTip;
  }
  const encLegend = () => `<div class="enc"><span><b style="font-weight:500">Colour</b> evidence type</span><span><b style="font-weight:500">Intensity</b><span class="int"><i style="--k:15%"></i><i style="--k:45%"></i><i style="--k:90%"></i></span> magnitude</span><span><b style="font-weight:500">Shape</b><span class="mk" style="--c:#3fb9d8"></span> raises <span class="mk d" style="--c:#3fb9d8"></span> lowers</span><span><span class="mk s" style="--c:#3fb9d8"></span> significant</span><span><span class="kd"></span> known gene</span></div>`;

  /* ================= GROUP DETAIL (overview + genes) ================= */
  function groupTabs(g, on) {
    return `<div class="tabs"><a href="${H('group/' + g.id)}" class="${on === 'o' ? 'on' : ''}">Overview</a><a href="${H('group/' + g.id + '/genes')}" class="${on === 'g' ? 'on' : ''}">Genes <span class="badge2">${g.size}</span></a></div>`;
  }
  function groupHead(g, on) {
    return `<a href="${H('groups')}" class="back">${I.back} All gene groups</a>
      <div class="dhead"><div><div class="eyebrow"><i></i>Rank ${g.rank} of ${UNIVERSE.length} · ${g.label}</div><h1>${g.id}</h1><p class="lede">${WHY(C, g)} ${g.size === 100 ? 'Reached the 100-gene cut-off.' : ''}</p></div><button class="btn sec gfavb ${isGFav(g.id) ? 'on' : ''}" data-gfav="${g.id}">${I.star.replace('<svg', '<svg width="17" height="17"')} <span>${isGFav(g.id) ? 'Favourited' : 'Favourite group'}</span></button></div>${groupTabs(g, on)}`;
  }
  function networkSvg(g) {
    const L = layoutOf(g), rg = rankedGenes(g), top = new Set(rg.slice(0, g.size > 30 ? 8 : 99));
    edgesOf(g.g);
    let o = `<svg viewBox="0 0 ${L.W} ${L.H}" id="netsvg">`;
    g.g.edges.forEach(([a, b, s]) => (o += `<line class="ed" data-e="${a}-${b}" x1="${L.pos[a][0].toFixed(1)}" y1="${L.pos[a][1].toFixed(1)}" x2="${L.pos[b][0].toFixed(1)}" y2="${L.pos[b][1].toFixed(1)}" stroke="#aeb5c8" stroke-width="${(0.6 + s * 1.4).toFixed(2)}" stroke-opacity=".5"/>`));
    g.members.forEach((m, i) => {
      const c = catOf(m), r = 3.5 + gs(g, m) * 8, k = C.K.has(m), x = L.pos[i][0].toFixed(1), y = L.pos[i][1].toFixed(1);
      o += `<g class="nd" data-i="${i}" data-sym="${m}">` + (k ? `<circle cx="${x}" cy="${y}" r="${r + 7}" fill="#4cc6e2" fill-opacity=".22"/><circle cx="${x}" cy="${y}" r="${r + 2}" fill="#4cc6e2" stroke="#1f2240" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${(r + 2) * 0.38}" fill="#fff"/>` : `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="${c.color}" fill-opacity=".15"/><circle cx="${x}" cy="${y}" r="${r}" style="fill:color-mix(in srgb, ${c.color} 55%, #fff)" stroke="${c.dark}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r * 0.36}" fill="#fff"/>`);
      if (k || top.has(m)) o += `<text class="lbl" x="${x}" y="${(+y + r + 15).toFixed(1)}" text-anchor="middle">${m}</text>`;
      o += '</g>';
    });
    return o + '</svg>';
  }
  function pageGroup(id) {
    const g = C.by[id]; if (!g) return (location.hash = H('groups'));
    const rg = rankedGenes(g), known = g.members.filter((m) => C.K.has(m)).sort((a, b) => ge(b).known - ge(a).known);
    const papers = C.papers.filter((p) => p.genes.some((s) => g.known.includes(s)));
    const fc = favCount(g);
    app.innerHTML = `<div class="page">${groupHead(g, 'o')}
      <div class="dkpis"><div class="dk"><div class="l">Genes</div><div class="n">${g.size}${g.size === 100 ? ' <small>cap</small>' : ''}</div></div><div class="dk"><div class="l">Known genes</div><div class="n cy">${g.nK}</div></div><div class="dk"><div class="l">Enrichment</div><div class="n">${g.enr.toFixed(1)}<small>× expected</small></div></div><div class="dk"><div class="l">Score</div><div class="n">${g.score}<small> / 100</small></div></div><div class="dk"><div class="l">Cohesion</div><div class="n">${g.cohesion.toFixed(2)}</div></div><div class="dk"><div class="l">Favourited</div><div class="n amb">${fc}</div></div></div>
      <div class="grid2"><div class="card"><div class="cardh"><h2>Evidence profile</h2><small>vs average of all groups</small></div><div class="rad">${radar({ series: [{ vals: g.prof.map(gp), k: 'c' }, { vals: C.avg.map(gp), k: 'a' }], w: true })}</div>
          <div class="legend2"><span><span class="ring" style="--c:#4cc6e2"></span>${g.id}</span><span><span class="ring" style="--c:#f5a63c"></span>All groups</span></div></div>
        <div class="card"><div class="cardh"><h2>Interaction network</h2><small>hover a gene · click to open</small></div><div class="netwrap">${networkSvg(g)}</div>
          <div class="legend2"><span><span class="ring" style="--c:#4cc6e2;--k:100%"></span>Known gene</span>${CATS.map((c) => `<span><span class="ring" style="--c:${c.color}"></span>${c.name}</span>`).join('')}</div></div></div>
      <div class="grid2" style="margin-top:24px">
        <div class="card"><div class="cardh"><h2>Highest-scoring genes</h2><a class="lnk" href="${H('group/' + g.id + '/genes')}">All ${g.size} genes ${I.fwd}</a></div>
          <div class="inter">${rg.slice(0, 8).map((m, i) => `<div class="int-r2">${favBtn(m, g.id, 'xs')}<span class="i">${i + 1}</span><a href="${H('gene/' + m + '?g=' + g.id)}"><b>${m}</b>${C.K.has(m) ? '<span class="kd"></span>' : ''}</a><div class="bar2"><i style="width:${pct(gs(g, m))}%"></i></div><span class="v num">${pct(gs(g, m))}</span></div>`).join('')}</div></div>
        <div class="card"><div class="cardh"><h2>Known genes in this group</h2><small>${known.length} linked by your papers</small></div>
          <div class="inter">${known.slice(0, 8).map((m) => `<div class="kn-r"><a href="${H('gene/' + m + '?g=' + g.id)}"><b>${m}</b><span class="kd"></span></a><span class="muted">${ge(m).known} paper${ge(m).known > 1 ? 's' : ''}</span></div>`).join('') || '<div class="empty-s">No known genes.</div>'}${known.length > 8 ? `<div class="faint" style="padding:8px 10px">+${known.length - 8} more</div>` : ''}</div></div></div>
      <div class="card" style="margin-top:24px"><div class="cardh"><h2>Supporting papers</h2><small>from your selection · fictional</small></div><div class="gl">${papers.map((p) => `<a href="${H('define')}"><span><b>${p.title}</b><small class="faint" style="display:block">${p.authors} · ${p.journal} · ${p.year}</small></span><span class="gchip">${p.genes.filter((s) => g.known.includes(s)).length} genes here</span></a>`).join('') || '<div class="empty-s">No selected paper links genes in this group.</div>'}</div></div></div>`;
    const svg = $('#netsvg'), L = layoutOf(g);
    svg.onmouseover = (e) => {
      const nd = e.target.closest('.nd'); if (!nd) { $$('.dim', svg).forEach((x) => x.classList.remove('dim')); return hideTip(); }
      const i = +nd.dataset.i, nb = new Set([i, ...g.g.adj[i].map((a) => a[0])]);
      $$('.nd', svg).forEach((x) => x.classList.toggle('dim', !nb.has(+x.dataset.i)));
      $$('.ed', svg).forEach((x) => { const [a, b] = x.dataset.e.split('-').map(Number); x.classList.toggle('dim', !(a === i || b === i)); });
      const s = nd.dataset.sym;
      showTip(`<b>${s}</b><div class="sub">${C.K.has(s) ? 'Known gene · ' + ge(s).known + ' paper(s)' : 'Closeness to known genes ' + C.prox(g, s).toFixed(2)}</div><div class="big">${pct(gs(g, s))}</div><div class="muted">gene score · ${g.g.adj[i].length} interactions</div>`);
    };
    svg.onmouseleave = () => { $$('.dim', svg).forEach((x) => x.classList.remove('dim')); hideTip(); };
    svg.onclick = (e) => { const nd = e.target.closest('.nd'); if (nd) location.hash = H('gene/' + nd.dataset.sym + '?g=' + g.id); };
  }
  function pageGenes(id) {
    const g = C.by[id]; if (!g) return (location.hash = H('groups'));
    const rg = rankedGenes(g), rk = Object.fromEntries(rg.map((m, i) => [m, i + 1]));
    app.innerHTML = `<div class="page">${groupHead(g, 'g')}
      <div class="card"><div class="mxbar"><div class="l"><div class="search" style="width:230px">${I.search}<input id="gq" placeholder="Filter genes"></div>
        <select id="gsort"><option value="rank">Sort: Gene score</option><option value="prox">Sort: Closeness</option>${CATS.map((c) => `<option value="${c.id}">Sort: ${c.name}</option>`).join('')}</select>
        <select id="grole"><option value="all">All genes</option><option value="known">Known genes only</option><option value="unk">Not linked by papers</option></select>
        <label class="ck" style="padding:0"><input type="checkbox" id="gfav"><span class="bx" style="--c:#f5a63c"></span>Favourited only</label></div><span class="muted" id="mxinfo"></span></div>
        <div style="margin-bottom:14px">${encLegend()}</div><div class="mx" id="mx"></div></div></div>`;
    const draw = () => {
      const q = $('#gq').value.trim().toUpperCase(), so = $('#gsort').value, ro = $('#grole').value, fo = $('#gfav').checked;
      let rows = rg.slice();
      if (so === 'prox') rows.sort((a, b) => C.prox(g, b) - C.prox(g, a));
      else if (so !== 'rank') { const ci = CATS.findIndex((c) => c.id === so); rows.sort((a, b) => ge(b).catScore[ci] - ge(a).catScore[ci]); }
      rows = rows.filter((m) => (!q || m.includes(q)) && (ro === 'all' || (ro === 'known') === C.K.has(m)) && (!fo || isFav(m)));
      $('#mxinfo').textContent = `${rows.length} genes × ${COLS.length} evidence columns`;
      matrix($('#mx'), rows.map((s) => ({ s, row: g, rk: rk[s] })));
    };
    draw();
    ['#gq', '#gsort', '#grole', '#gfav'].forEach((s) => ($(s).oninput = $(s).onchange = draw));
  }

  /* ================= GENE DETAIL ================= */
  function pageGene(sym, gid) {
    const e0 = GENES[sym]; if (!e0) return (location.hash = H('groups'));
    const mem = GENEGROUPS[sym] || [];
    const g = C.by[gid] && C.by[gid].members.includes(sym) ? C.by[gid] : C.by[[...mem].sort((a, b) => C.by[a].rank - C.by[b].rank)[0]];
    const e = ge(sym), cat = catOf(sym), known = !!e.known;
    const rg = g ? rankedGenes(g) : [], idx = g ? rg.indexOf(sym) : -1, prev = idx > 0 ? rg[idx - 1] : null, next = idx >= 0 && idx < rg.length - 1 ? rg[idx + 1] : null;
    const gi = g ? edgesOf(g.g).idx[sym] : -1;
    const inter = g ? g.g.adj[gi].slice().sort((a, b) => b[1] - a[1]).slice(0, 7) : [];
    const closest = g && !known ? C.closest(g, sym) : [];
    const papers = C.papers.filter((p) => p.genes.includes(sym));
    const score = g ? pct(gs(g, sym)) : pct(geneScore(C, sym, cur.w));
    const why = known ? `Linked to ${esc(diseaseName())} by ${e.known} of your ${cur.papers.length} selected papers — genetics scores high.`
      : closest.length ? `Not linked to ${esc(diseaseName())} by your papers, so genetics scores low. It interacts with known gene${closest.length > 1 ? 's' : ''} ${closest.slice(0, 3).map(([s, v]) => `<b>${s}</b> (${v.toFixed(2)})`).join(', ')}.`
      : `Not linked to ${esc(diseaseName())} by your papers, and no direct interaction with a known gene in this group.`;
    app.innerHTML = `<div class="page">
      <a href="${g ? H('group/' + g.id + '/genes') : H('groups')}" class="back">${I.back} ${g ? g.id + ' · genes' : 'All gene groups'}</a>
      <div class="gtitle"><h1>${sym}</h1><div class="tags">${known ? '<span class="pill first">Known gene</span>' : ''}<span class="pill ${known ? 'expl' : 'first'}">${cat.name} led</span>${g ? `<span class="pill expl">#${idx + 1} of ${g.size} in ${g.id}</span>` : ''}<span class="pill expl">${mem.length} group${mem.length === 1 ? '' : 's'}</span>${GENES[sym].lit < 0.3 ? '<span class="pill prom">Understudied</span>' : ''}</div>
        <div class="acts"><div class="nav2">${prev ? `<a class="btn sec sm" href="${H('gene/' + prev + '?g=' + g.id)}">${I.back} ${prev}</a>` : ''}${next ? `<a class="btn sec sm" href="${H('gene/' + next + '?g=' + g.id)}">${next} ${I.fwd}</a>` : ''}</div>
          <button class="btn sec ${isFav(sym) ? 'on' : ''}" data-fav="${sym}" data-fg="${g ? g.id : ''}">${I.star.replace('<svg', '<svg width="17" height="17"')} <span>${isFav(sym) ? 'Favourited' : 'Add to shortlist'}</span></button></div></div>
      <div class="whybox"><div class="wscore"><div class="n">${score}</div><small>gene score</small></div><p>${why}</p></div>
      <div class="gcols"><div style="display:flex;flex-direction:column;gap:24px">
        <div class="card"><div class="cardh"><h2>Evidence profile</h2><small>vs ${g ? g.id + ' average' : 'average'}</small></div><div class="rad">${radar({ series: [{ vals: e.ax, k: 'c' }, { vals: g ? g.prof : e.ax.map(() => 0.3), k: 'a' }], w: true })}</div>
          <div class="legend2"><span><span class="ring" style="--c:#4cc6e2"></span>${sym}</span><span><span class="ring" style="--c:#f5a63c"></span>Group average</span></div></div>
        <div class="card"><div class="cardh"><h2>Strongest interactors</h2><small>within ${g ? g.id : 'group'}</small></div><div class="inter">${inter.length ? inter.map(([j, s]) => { const m = g.members[j], c = catOf(m); return `<a class="int-r" href="${H('gene/' + m + '?g=' + g.id)}"><span class="ring" style="--c:${c.color}"></span><b>${m}${C.K.has(m) ? '<span class="kd"></span>' : ''}</b><div class="bar2" style="margin:0"><i style="width:${pct(s)}%"></i></div></a>`; }).join('') : '<div class="empty-s">No interactions recorded.</div>'}</div></div>
      </div><div style="display:flex;flex-direction:column;gap:24px">
        ${known ? `<div class="card"><div class="cardh"><h2>Supporting papers</h2><small>${papers.length} of your selection · fictional</small></div><div class="gl">${papers.map((p) => `<a href="${H('define')}"><span><b>${p.title}</b><small class="faint" style="display:block">${p.authors} · ${p.journal} · ${p.year}</small></span><span class="pill expl">${p.type}</span></a>`).join('')}</div></div>` : ''}
        <div class="card"><div class="cardh"><h2>Evidence by type</h2><small>top signals per category</small></div>
          ${CATS.map((c, ci) => { const cols = COLS.map((x, k) => ({ x, cell: e.cells[k] })).filter((o) => o.x.cat === c.id && o.cell).sort((a, b) => b.cell[0] - a.cell[0]).slice(0, 4);
            return `<div class="ecat"><h3><span class="ring" style="--c:${c.color}"></span>${c.name}<span class="sc">${pct(clamp(e.catScore[ci]))}</span></h3>${cols.length ? cols.map((o) => `<div class="erow"><span class="mk ${o.cell[1] < 0 ? 'd' : ''} ${o.cell[2] ? 's' : ''}" style="--c:${c.color};--k:${Math.round(12 + o.cell[0] * 88)}%"></span><span class="t">${o.x.name}</span><div class="bar2"><i style="width:${pct(o.cell[0])}%;background:color-mix(in srgb, ${c.color} 40%, #fff);border-color:${c.color}"></i></div><span class="v">${(o.cell[0] * 11).toFixed(1)} −log₁₀p</span></div>`).join('') : '<div class="empty-s" style="padding:4px 0">No evidence recorded.</div>'}</div>`; }).join('')}</div>
        <div class="grid2"><div class="card"><div class="cardh"><h2>In ${mem.length} group${mem.length === 1 ? '' : 's'}</h2></div><div class="gl">${[...mem].map((id) => C.by[id]).sort((a, b) => a.rank - b.rank).slice(0, 6).map((x) => `<a href="${H('group/' + x.id)}"><b>${x.id}</b><span class="muted num">score ${x.score}</span></a>`).join('')}</div></div>
          <div class="card"><div class="cardh"><h2>Notes</h2></div><textarea id="note" placeholder="Why this gene matters…">${esc(cur.notes[sym] || '')}</textarea></div></div>
      </div></div></div>`;
    $('#note').oninput = (ev) => { cur.notes[sym] = ev.target.value; touch(); };
  }

  /* ================= SHORTLIST ================= */
  function csv(rows) { return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'); }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function pageShortlist() {
    const rows = cur.favs.map((f) => ({ s: f.s, row: rowOfFav(f) })).filter((r) => r.row);
    const kn = rows.filter((r) => C.K.has(r.s)).length, grp = new Set(rows.map((r) => r.row.id)).size;
    app.innerHTML = `<div class="page"><div class="ghead"><div><div class="eyebrow"><i></i>${esc(diseaseName())}</div><h1>Shortlist</h1>
      <p class="lede">The genes you favourited in <b style="font-weight:500;color:var(--ink)">${esc(cur.name || 'this investigation')}</b>. Share the list with colleagues or export it.</p></div>
      <div style="display:flex;gap:12px"><button class="btn sec" id="exp">${I.dl} Export CSV</button><button class="btn pri" id="share">${I.share} Share</button></div></div>
      <div class="dkpis" style="grid-template-columns:repeat(4,1fr);margin-top:30px"><div class="dk"><div class="l">Genes</div><div class="n amb">${rows.length}</div></div><div class="dk"><div class="l">Known genes</div><div class="n cy">${kn}</div></div><div class="dk"><div class="l">Not linked by papers</div><div class="n">${rows.length - kn}</div></div><div class="dk"><div class="l">Gene groups</div><div class="n">${grp}</div></div></div>
      ${(cur.gfavs || []).length ? `<div class="gfl">${cur.gfavs.map((id) => `<a href="${H('group/' + id)}">${I.star}${id}</a>`).join('')}</div>` : ''}<div class="card">${rows.length ? `<div style="margin-bottom:14px">${encLegend()}</div><div class="mx" id="mx"></div>` : `<div class="empty">Nothing favourited yet.<br><a class="btn sec sm" style="margin-top:16px" href="${H('groups')}">Browse gene groups</a></div>`}</div></div>`;
    if (rows.length) matrix($('#mx'), rows.sort((a, b) => gs(b.row, b.s) - gs(a.row, a.s)).map((r, i) => ({ ...r, rk: i + 1 })), { group: true });
    $('#exp').onclick = () => {
      const t = [['Gene', 'Group', 'Papers linking gene', 'Gene score', 'Closeness', ...CATS.map((c) => c.name + ' score'), 'Note'], ...rows.map((r) => [r.s, r.row.id, ge(r.s).known, pct(gs(r.row, r.s)), C.prox(r.row, r.s).toFixed(2), ...ge(r.s).catScore.map((v) => pct(clamp(v))), cur.notes[r.s] || ''])];
      download('lattice-shortlist.csv', csv(t), 'text/csv'); toast(`Exported ${rows.length} genes`);
    };
    $('#share').onclick = openShare;
  }
  function openShare() {
    const m = document.createElement('div'); m.className = 'modal'; let people = [];
    m.innerHTML = `<div class="mbox"><div class="cardh"><h2>Share shortlist</h2><button class="lnk" data-x>Close</button></div>
      <p class="muted" style="margin-bottom:18px">${cur.favs.length} genes from <b style="font-weight:500;color:var(--ink)">${esc(cur.name)}</b>.</p>
      <label class="fl">Invite people</label><div class="mail"><div id="chips"></div><input id="mi" placeholder="Add an email and press Enter"></div>
      <div class="two2"><div><label class="fl">Access</label><select id="acc" style="width:100%"><option>Can view</option><option>Can comment</option><option>Can edit favourites</option></select></div>
      <div><label class="fl">Include</label><label class="ck" style="padding-top:12px"><input type="checkbox" id="inn" checked><span class="bx"></span>My notes on genes</label></div></div>
      <label class="fl" style="margin-top:18px">Or copy a link</label><div class="linkrow"><input readonly value="https://lattice.example/s/${Math.random().toString(36).slice(2, 8)}"><button class="btn sec sm" id="cp">Copy link</button></div>
      <div style="display:flex;justify-content:flex-end;margin-top:24px"><button class="btn pri" id="send">Share</button></div></div>`;
    document.body.appendChild(m);
    const close = () => m.remove(), draw = () => ($('#chips', m).innerHTML = people.map((p) => `<span class="gchip">${esc(p)}</span>`).join(''));
    m.onclick = (e) => { if (e.target === m || e.target.dataset.x !== undefined) close(); };
    $('#mi', m).onkeydown = (e) => { if (e.key === 'Enter' && e.target.value.trim()) { people.push(e.target.value.trim()); e.target.value = ''; draw(); } };
    $('#cp', m).onclick = () => { try { navigator.clipboard.writeText($('input[readonly]', m).value); } catch (x) {} toast('Link copied'); };
    $('#send', m).onclick = () => { close(); toast(people.length ? `Shared with ${people.length} ${people.length === 1 ? 'person' : 'people'}` : 'Sharing settings saved'); };
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]'), go = e.target.closest('[data-go]'), op = e.target.closest('[data-open]'), nw = e.target.closest('[data-new]'), ar = e.target.closest('[data-arch]');
    if (fav && cur) {
      e.stopPropagation(); e.preventDefault(); const s = fav.dataset.fav, i = cur.favs.findIndex((f) => f.s === s);
      if (i >= 0) cur.favs.splice(i, 1); else cur.favs.push({ s, g: fav.dataset.fg });
      touch(); updBadge(); const on = isFav(s);
      $$(`[data-fav="${s}"]`).forEach((b) => { b.classList.toggle('on', on); const t = $('span', b); if (t) t.textContent = on ? 'Favourited' : 'Add to shortlist'; });
      toast(on ? s + ' added to shortlist' : s + ' removed from shortlist');
      if (location.hash.endsWith('/shortlist')) route(); return;
    }
    const gf = e.target.closest('[data-gfav]');
    if (gf && cur) {
      e.stopPropagation(); e.preventDefault(); const id = gf.dataset.gfav; cur.gfavs = cur.gfavs || []; const k = cur.gfavs.indexOf(id);
      if (k >= 0) cur.gfavs.splice(k, 1); else cur.gfavs.push(id);
      touch(); const on = isGFav(id);
      $$(`[data-gfav="${id}"]`).forEach((b) => { b.classList.toggle('on', on); const t = $('span', b); if (t) t.textContent = on ? 'Favourited' : 'Favourite group'; });
      toast(on ? id + ' added to shortlist' : id + ' removed from shortlist');
      if (location.hash.endsWith('/shortlist')) route(); return;
    }
    if (ar) { e.stopPropagation(); const i = ST.inv.find((x) => x.id === ar.dataset.arch); i.archived = !i.archived; save(); pageHome(); toast(i.archived ? 'Investigation archived' : 'Investigation restored'); return; }
    if (nw) { const i = newInv(); ST.inv.push(i); save(); location.hash = `#/i/${i.id}/define`; return; }
    if (op) { const i = ST.inv.find((x) => x.id === op.dataset.open); if (i.archived) return toast('Restore this investigation to open it'); location.hash = `#/i/${i.id}/groups`; return; }
    if (go) location.hash = go.dataset.go;
  });

  /* ---------- router ---------- */
  let wasHome = null;
  function route() {
    const hp = location.hash.replace(/^#\/?/, '').split('?')[0].split('/'), goHome = !(hp[0] === 'i' && ST.inv.some((i) => i.id === hp[1]));
    const bgel = $('#bluebg'); if (wasHome !== null && wasHome !== goHome) { bgel.classList.add('anim'); clearTimeout(route.t); route.t = setTimeout(() => bgel.classList.remove('anim'), 1000); }
    wasHome = goHome;
    document.body.classList.remove('home'); hideTip(); app.onmouseover = null; app.onmouseleave = null;
    const raw = location.hash.replace(/^#\/?/, ''), [path, qs] = raw.split('?'), p = path.split('/'), q = new URLSearchParams(qs || '');
    document.querySelector('.modal') && document.querySelector('.modal').remove();
    if (p[0] === 'i' && enter(p[1])) {
      nav(p); window.scrollTo(0, 0);
      if (p[2] === 'define') pageDefine();
      else if (p[2] === 'group' && p[4] === 'genes') pageGenes(p[3]);
      else if (p[2] === 'group') pageGroup(p[3]);
      else if (p[2] === 'gene') pageGene(p[3], q.get('g'));
      else if (p[2] === 'shortlist') pageShortlist();
      else if (!cur.disease || !cur.papers.length) location.hash = H('define');
      else pageGroups();
    } else { cur = null; C = null; nav(p); window.scrollTo(0, 0); document.body.classList.add('home'); pageHome(); return; }
  }
  /* ---------- custom dropdowns: every <select> is wrapped, the native element stays as the source of truth ---------- */
  const CHEV = '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1.5l5 5 5-5"/></svg>';
  function enhanceSelects() {
    $$('select:not([data-dd])').forEach((sel) => {
      sel.dataset.dd = '1'; sel.classList.add('dd-native');
      const w = document.createElement('div'); w.className = 'dd'; if (sel.style.width) w.style.width = sel.style.width;
      w.innerHTML = `<button type="button" class="dd-btn" aria-haspopup="listbox"><span></span>${CHEV}</button><div class="dd-menu" role="listbox"></div>`;
      sel.parentNode.insertBefore(w, sel); w.appendChild(sel);
    });
    $$('.dd select').forEach((sel) => { const sp = $('.dd-btn span', sel.parentNode), o = sel.selectedOptions[0], t = o ? o.textContent : ''; if (sp.textContent !== t) sp.textContent = t; $('.dd-btn', sel.parentNode).classList.toggle('ph', !sel.value); });
  }
  const closeDd = () => $$('.dd.open').forEach((d) => d.classList.remove('open'));
  function openDd(w) {
    const sel = $('select', w), menu = $('.dd-menu', w), btn = $('.dd-btn', w);
    menu.innerHTML = [...sel.options].map((o, i) => (o.disabled ? '' : `<div class="dd-opt ${o.selected ? 'on' : ''}" role="option" data-i="${i}"><span class="ring"></span>${esc(o.textContent)}</div>`)).join('');
    closeDd(); w.classList.add('open'); w.classList.remove('up');
    if (btn.getBoundingClientRect().bottom + menu.offsetHeight + 12 > innerHeight && btn.getBoundingClientRect().top > menu.offsetHeight + 12) w.classList.add('up');
    const on = $('.dd-opt.on', menu); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  const pickDd = (w, i) => { const sel = $('select', w); sel.selectedIndex = +i; closeDd(); enhanceSelects(); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); $('.dd-btn', w).focus(); };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dd-btn'), opt = e.target.closest('.dd-opt');
    if (opt) { e.stopPropagation(); pickDd(opt.closest('.dd'), opt.dataset.i); }
    else if (btn) { e.stopPropagation(); const w = btn.parentNode; if (w.classList.contains('open')) closeDd(); else openDd(w); }
    else if (!e.target.closest('.dd')) closeDd();
  }, true);
  document.addEventListener('keydown', (e) => {
    const w = $('.dd.open') || (document.activeElement && document.activeElement.closest && document.activeElement.closest('.dd'));
    if (!w) return;
    const open = w.classList.contains('open'), items = $$('.dd-opt', w), cur = items.findIndex((x) => x.classList.contains('hl') || x.classList.contains('on'));
    if (e.key === 'Escape') { closeDd(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!open) return openDd(w);
      const n = Math.max(0, Math.min(items.length - 1, cur + (e.key === 'ArrowDown' ? 1 : -1)));
      items.forEach((x) => x.classList.remove('hl', 'on')); items[n].classList.add('hl'); items[n].scrollIntoView({ block: 'nearest' });
    } else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); const h = $('.dd-opt.hl', w); if (h) pickDd(w, h.dataset.i); else closeDd(); }
  });
  new MutationObserver(enhanceSelects).observe(document.body, { childList: true, subtree: true, characterData: true });

  addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 38), { passive: true });
  /* user menu */
  document.addEventListener('click', (e) => {
    const u = $('#user'), b = e.target.closest('.ubtn'), it = e.target.closest('[data-u]');
    if (b) { u.classList.toggle('open'); return; }
    if (it) { u.classList.remove('open'); toast(it.dataset.u === 'logout' ? 'Logging out is not part of this prototype' : 'Settings are not part of this prototype'); return; }
    if (u) u.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#user').classList.remove('open'); });

  addEventListener('hashchange', route);
  route(); enhanceSelects();
})();
