/* Internal API catalog prototype — catalog, API detail with the "Get access" flow, keys, services and help. All data is fictional (see data.js). */
(function () {
  var D = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var byId = function (id) { return D.apis.filter(function (a) { return a.id === id; })[0]; };
  var emptyForm = function () { return { keyName: '', expiry: '90', ip: '', app: '', team: '', callback: '', usage: '' }; };

  var S = {
    page: 'apis', api: 'auth', tab: 'overview',
    q: '', cat: 'All', sort: 'name',
    step: 1, env: 'test', done: false, attached: false, attachBad: false, autoName: '', f: emptyForm(),
    keys: JSON.parse(JSON.stringify(D.keys)), requested: {}
  };
  var cur = function () { return byId(S.api); };
  var isOpen = function (a) { return a.access === 'open'; };

  /* Environment definitions: the shared copy from data.js plus what depends on the chosen API. */
  function envs() {
    var a = cur();
    return D.envs.map(function (e) {
      return Object.assign({}, e, { immediate: e.id === 'test' || isOpen(a), reviewer: a.reviewer });
    });
  }
  var env = function () { return envs().filter(function (e) { return e.id === S.env; })[0]; };

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- health icons ---------- */
  function health(a) {
    return ['test', 'prod'].map(function (k) {
      var h = a.health[k], st = D.healthStates[h[0]], name = k === 'test' ? 'Test' : 'Production';
      var body = (h[2] ? h[2] + ' ' : '') + h[1] + '% uptime (30 days)';
      return '<span class="hi ' + h[0] + '" tabindex="0" role="img" aria-label="' + name + ': ' + st.label + '" data-tip-t="' + name + ' · ' + st.label + '" data-tip-b="' + esc(body) + '"><i class="fa-solid fa-' + st.icon + '"></i></span>';
    }).join('');
  }

  /* ---------- header ---------- */
  function header() {
    var on = S.page === 'api' ? 'apis' : S.page;
    var items = [['apis', 'plug', 'APIs'], ['keys', 'key', 'Keys'], ['services', 'handshake', 'Services'], ['help', 'circle-question', 'Help']];
    $('#hdr').innerHTML =
      '<div class="logo" data-nav="apis"><b>API</b> <span>Portal</span></div>' +
      '<nav class="menu">' + items.map(function (i) {
        return '<a class="mi' + (on === i[0] ? ' on' : '') + '" data-nav="' + i[0] + '" href="#"><i class="fa-solid fa-' + i[1] + '"></i>' + i[2] + '</a>';
      }).join('') + '</nav>' +
      '<div class="hdr-r"><button class="ib" data-nope="Profile" aria-label="Profile"><i class="fa-regular fa-user"></i></button><button class="ib" data-nope="Theme switching" aria-label="Theme"><i class="fa-regular fa-sun"></i></button></div>';
  }

  function pageHead(title, sub) {
    return '<div class="title-row"><h1>' + title + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>';
  }

  /* ---------- APIs: catalog ---------- */
  function catalog() {
    var chips = ['All'].concat(D.categories).map(function (c) { return '<button class="fchip' + (S.cat === c ? ' on' : '') + '" data-chip="' + c + '">' + c + '</button>'; }).join('');
    return '<div class="wrap">' + pageHead('APIs') +
      '<div class="toolbar"><label class="search"><i class="fa-solid fa-magnifying-glass"></i><input id="q" type="search" placeholder="Search by name, description or team" value="' + esc(S.q) + '" autocomplete="off"></label>' +
      '<div class="chips" id="chips">' + chips + '</div>' +
      '<label class="sortsel"><span>Sort</span><select class="in" id="sort"><option value="name">Name A–Z</option><option value="used">Most used</option><option value="updated">Recently updated</option></select></label></div>' +
      '<div class="grid" id="grid"></div></div>';
  }

  function apiCard(a) {
    var open = isOpen(a);
    return '<article class="acard" data-open="' + a.id + '" tabindex="0" role="link" aria-label="' + esc(a.name) + '">' +
      '<div class="ah"><h3>' + esc(a.name) + '</h3><span class="vchip">v' + a.v + '</span></div>' +
      '<p class="ad">' + esc(a.desc) + '</p>' +
      '<div class="tags"><span class="badge ' + a.status.toLowerCase() + '">' + a.status + '</span>' +
      '<span class="acc ' + (open ? 'open' : 'restr') + '" title="' + (open ? 'Production access is granted immediately' : 'Production access needs approval') + '"><i class="fa-solid fa-lock' + (open ? '-open' : '') + '"></i>' + (open ? 'Open' : 'Restricted') + '</span></div>' +
      '<div class="af"><span class="own">' + esc(a.owner) + '</span><span class="hl">' + health(a) + '</span></div></article>';
  }

  function renderGrid() {
    var q = S.q.trim().toLowerCase();
    var list = D.apis.filter(function (a) {
      return (S.cat === 'All' || a.cat === S.cat) && (!q || (a.name + ' ' + a.desc + ' ' + a.owner + ' ' + a.cat).toLowerCase().indexOf(q) > -1);
    });
    list.sort(function (x, y) {
      if (S.sort === 'used') return y.used - x.used;
      if (S.sort === 'updated') return y.updated < x.updated ? -1 : 1;
      return x.name.localeCompare(y.name);
    });
    $('#grid').innerHTML = list.length ? list.map(apiCard).join('') :
      '<div class="empty"><i class="fa-regular fa-face-frown"></i><b>No APIs match “' + esc(S.q) + '”</b><span>Try a different word or clear the category filter.</span><button class="btn ghost" data-clear>Clear filters</button></div>';
  }

  /* ---------- API detail ---------- */
  function shell() {
    var a = cur();
    var tabs = [['overview', 'Overview'], ['docs', 'Documentation'], ['code', 'Code examples']];
    return '<div class="title-row"><button class="crumb" data-nav="apis"><i class="fa-solid fa-arrow-left"></i>All APIs</button>' +
      '<div class="tr"><h1>' + esc(a.name) + '</h1><span class="vchip">v' + a.v + '</span><span class="hl big">' + health(a) + '</span></div></div>' +
      '<div class="tabs-row"><button class="btn" data-tab="access" style="' + (S.tab === 'access' ? '' : 'background:transparent;border-top-color:transparent;color:#fff;border:1px solid rgba(255,255,255,.2)') + '">Get Access</button><span class="tdiv"></span>' +
      tabs.map(function (t) { return '<button class="tab' + (S.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '"><i class="fa-solid fa-compass"></i>' + t[1] + '</button>'; }).join('') +
      '</div><div class="rule"></div>';
  }

  function endpointsOf(a) {
    if (a.id === 'auth') return [['POST', '/v2/token', 'Exchange credentials for an access token'], ['POST', '/v2/token/refresh', 'Refresh an expired access token'], ['GET', '/v2/userinfo', 'Return claims for the signed-in user'], ['POST', '/v2/revoke', 'Revoke a token before it expires']];
    return [['GET', a.base, 'List items'], ['GET', a.base + '/{id}', 'Get one item'], ['POST', a.base, 'Create an item'], ['DELETE', a.base + '/{id}', 'Delete an item']];
  }
  function overview() {
    var a = cur();
    return '<div class="page plain"><section><h3>About this API</h3><p>' + esc(a.desc) + ' Version ' + a.v + ', owned by the ' + esc(a.owner) + ' team. Production access is ' + (isOpen(a) ? 'granted immediately.' : 'restricted and reviewed by ' + a.reviewer + '.') + '</p></section>' +
      '<section><h3>Endpoints</h3><table class="tbl">' + endpointsOf(a).map(function (e) { return '<tr><td class="m">' + e[0] + '</td><td class="p">' + esc(e[1]) + '</td><td>' + e[2] + '</td></tr>'; }).join('') + '</table></section></div>';
  }
  function docs() {
    var a = cur();
    var items = [['Getting started', 'Make your first request to ' + a.name + ' in five minutes.'], ['Authentication', 'How to send your key and what to do when it expires.'], ['Error reference', 'Every error code this API can return, with fixes.'], ['Rate limits', 'Limits per environment and how to request more.']];
    return '<div class="page plain"><section><h3>Documentation</h3><div class="dgrid">' + items.map(function (d) { return '<div class="dcard" data-nope="This article"><b>' + d[0] + '</b><span>' + d[1] + '</span></div>'; }).join('') + '</div></section></div>';
  }
  function code() {
    var a = cur();
    var path = a.id === 'auth' ? '/v2/token' : a.base;
    var data = a.id === 'auth' ? ' \\\n  -d \'{"<em>client_id</em>": "YOUR_APP_ID", "<em>client_secret</em>": "YOUR_KEY"}\'' : '';
    return '<div class="page plain"><section><h3>Your first request</h3><pre class="code">curl -X ' + (a.id === 'auth' ? 'POST' : 'GET') + ' https://api.example.internal' + esc(path) + ' \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: <em>YOUR_KEY</em>"' + data + '</pre></section></div>';
  }

  /* ---------- Get access wizard ---------- */
  function stepper() {
    var names = ['Environment', 'Key info', 'App info'];
    return '<div class="stepper"><div class="lines"><i class="' + (S.step > 1 ? 'done' : '') + '"></i><i class="' + (S.step > 2 ? 'done' : '') + '"></i></div>' +
      names.map(function (n, i) {
        var k = i + 1, cls = S.done || k < S.step ? 'done' : k === S.step ? 'on' : '';
        return '<div class="step ' + cls + '"><div class="ring"><div class="dot">' + (S.done || k < S.step ? '<i class="fa-solid fa-check"></i>' : k) + '</div></div><label>' + n + '</label></div>';
      }).join('') + '</div>';
  }

  function envCard(e) {
    var sel = S.env === e.id;
    var alerts = e.immediate
      ? '<div class="alert ok"><i class="fa-solid fa-circle-check"></i><span>Access is granted immediately.</span></div>'
      : '<div class="alert warn"><i class="fa-solid fa-triangle-exclamation"></i><div>Approval required<ul><li>processing time ~2 weeks.</li><li>reviewer: <span class="lnk" data-link="Reviewer profile">' + e.reviewer + '</span>.</li></ul></div></div>' +
        '<div class="alert warn"><i class="fa-solid fa-triangle-exclamation"></i><div>You will need to submit:<ul><li>Integration Security Assessment.</li><li><span class="lnk" data-link="This guide">How to write this document</span></li></ul></div></div>';
    return '<div class="card' + (sel ? ' sel' : '') + '" data-env="' + e.id + '" role="radio" aria-checked="' + sel + '" tabindex="0">' +
      '<div><h3>' + e.title + '</h3><div class="sub">Environment</div></div>' +
      '<span class="chip"><i class="fa-solid fa-' + e.keyIcon + '"></i>' + e.keyType + '</span>' +
      '<p class="desc">' + e.blurb + '</p>' + alerts +
      '<div class="sel-badge">SELECTED</div></div>';
  }

  function stepEnv() {
    return '<div class="hd"><h2>Choose Environment</h2><p>Select the environment where you want to deploy your API keys.</p></div>' +
      '<div class="envs" role="radiogroup">' + envs().map(envCard).join('') + '</div>';
  }

  function field(id, label, control, hint) {
    return '<div class="fld" data-f="' + id + '"><label for="' + id + '">' + label + '</label>' + control + (hint ? '<div class="hint">' + hint + '</div>' : '') + '<div class="err">This field is required.</div></div>';
  }

  function stepKey() {
    var e = env(), prod = e.id === 'prod';
    var auto = cur().id + '-' + e.id + '-key';
    if (!S.f.keyName || S.f.keyName === S.autoName) S.f.keyName = auto;
    S.autoName = auto;
    var exp = prod
      ? field('expiry', 'Rotation period', '<select class="in" id="expiry">' + ['30', '60', '90'].map(function (d) { return '<option value="' + d + '"' + (S.f.expiry === d ? ' selected' : '') + '>Every ' + d + ' days</option>'; }).join('') + '</select>', 'The key is replaced automatically; the previous one stays valid for 48 hours.')
      : field('expiry', 'Expires after', '<select class="in" id="expiry">' + ['30', '90', '365'].map(function (d) { return '<option value="' + d + '"' + (S.f.expiry === d ? ' selected' : '') + '>' + d + ' days</option>'; }).join('') + '</select>', 'Test keys can be renewed at any time.');
    return '<div class="hd"><h2>Key info</h2><p>Name your ' + e.title.toLowerCase() + ' key and decide how long it lives.</p></div>' +
      '<div class="panel">' +
        '<div class="row"><div class="fld"><label>Environment</label><div><span class="chip" style="background:rgba(0,0,0,.3)">' + e.title + '</span></div></div>' +
        '<div class="fld"><label>Key type</label><div><span class="chip" style="background:rgba(0,0,0,.3)"><i class="fa-solid fa-' + e.keyIcon + '"></i>' + e.keyType + '</span></div></div></div>' +
        field('keyName', 'Key name', '<input class="in" id="keyName" value="' + esc(S.f.keyName) + '">', 'Lowercase letters, numbers and dashes.') +
        exp +
        field('ip', 'IP allow-list <span style="font-weight:400;color:var(--muted)">(optional)</span>', '<input class="in" id="ip" placeholder="e.g. 10.20.0.0/16" value="' + esc(S.f.ip) + '">') +
      '</div>';
  }

  var needsDoc = function () { return !env().immediate; };

  function stepApp() {
    return '<div class="hd"><h2>App info</h2><p>Tell us which application will use this key.</p></div>' +
      '<div class="panel">' +
        '<div class="row">' + field('app', 'Application name', '<input class="in" id="app" placeholder="e.g. Lab Inventory Web" value="' + esc(S.f.app) + '">') +
        field('team', 'Owning team', '<select class="in" id="team"><option value="">Select a team…</option>' + D.teams.map(function (t) { return '<option' + (S.f.team === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') + '</div>' +
        field('callback', 'Callback URL', '<input class="in" id="callback" placeholder="https://" value="' + esc(S.f.callback) + '">') +
        field('usage', 'How will you use the API?', '<textarea class="in" id="usage" placeholder="A sentence or two is enough.">' + esc(S.f.usage) + '</textarea>') +
        (needsDoc() ? '<div class="fld"><label>Integration Security Assessment</label><div class="attach' + (S.attached ? ' done' : '') + '" data-attach><i class="fa-solid fa-' + (S.attached ? 'circle-check' : 'paperclip') + '"></i><span>' + (S.attached ? 'security-assessment-v1.pdf attached' : 'Attach document (required for this production request)') + '</span></div><div class="err" style="display:' + (S.attachBad ? 'block' : 'none') + ';font-size:12px;color:#ffb4a0">Production access needs the assessment attached.</div></div>' : '') +
      '</div>';
  }

  function stepDone() {
    var e = env(), a = cur(), pending = !e.immediate;
    var body = pending
      ? '<div class="done-icon wait"><i class="fa-solid fa-hourglass-half"></i></div><div class="hd"><h2>Request submitted</h2><p>' + e.reviewer + ' will review your request. Expected processing time is about 2 weeks.</p></div>'
      : '<div class="done-icon"><i class="fa-solid fa-check"></i></div><div class="hd"><h2>Your key is ready</h2><p>Copy it now — for security we only show it once.</p></div>' +
        '<div class="panel" style="gap:12px"><div class="keybox"><span>' + (e.id === 'test' ? 'tst' : 'prd') + '_9f3a7c21e4b84d0f8a6e5b1c27d93f40</span><button class="btn ghost" data-copy>Copy</button></div></div>';
    return body +
      '<dl class="summary" style="width:640px"><dt>API</dt><dd>' + esc(a.name) + '</dd><dt>Environment</dt><dd>' + e.title + '</dd><dt>Key</dt><dd>' + esc(S.f.keyName) + ' · ' + e.keyType + '</dd><dt>Application</dt><dd>' + esc(S.f.app) + ' · ' + esc(S.f.team) + '</dd></dl>' +
      '<div class="foot" style="padding-top:0"><button class="btn ghost lg" data-restart>Request another key</button><button class="btn lg" data-nav="keys">View my keys</button></div>';
  }

  function wizard() {
    var inner = S.done ? stepDone() : S.step === 1 ? stepEnv() : S.step === 2 ? stepKey() : stepApp();
    var label = S.step === 3 ? (needsDoc() ? 'Submit request' : 'Get key') : 'Next';
    var foot = S.done ? '' : '<div class="foot">' +
      (S.step > 1 ? '<button class="btn ghost lg" data-back><i class="fa-solid fa-chevron-left"></i>Back</button>' : '') +
      '<button class="btn lg" data-next><i class="fa-solid fa-' + (S.step === 3 ? 'paper-plane' : 'chevron-right') + '"></i>' + label + '</button></div>';
    return '<div class="page">' + stepper() + inner + foot + '</div>';
  }

  function detail() {
    var content = S.tab === 'overview' ? overview() : S.tab === 'docs' ? docs() : S.tab === 'code' ? code() : wizard();
    return shell() + content;
  }

  /* ---------- Keys ---------- */
  function keyItem(k, envId) {
    var pend = k.apis.filter(function (x) { return x[1] === 'pending'; }).length;
    var rows = k.apis.map(function (x) {
      var a = byId(x[0]), ok = x[1] === 'approved';
      return '<li class="kapi" data-open="' + a.id + '" tabindex="0"><span class="kn">' + esc(a.name) + '</span>' +
        '<span class="ks ' + x[1] + '"><i class="fa-solid fa-' + (ok ? 'circle-check' : 'clock') + '"></i>' + (ok ? 'Approved' : 'Pending') + '</span>' +
        '<span class="kd">' + (ok ? 'Approved ' + x[2] : 'Submitted ' + x[2] + ' · reviewer ' + esc(a.reviewer || 'API owner')) + '</span></li>';
    }).join('');
    return '<div class="key" data-keyid="' + k.id + '"><button class="khead" data-key aria-expanded="false">' +
      '<span class="kmain"><b>' + esc(k.name) + '</b><span class="kmeta">' + k.masked + ' · Created ' + k.created + '</span><span class="kmeta">' + k.life + '</span></span>' +
      '<span class="ksum">' + k.apis.length + (k.apis.length === 1 ? ' API' : ' APIs') + (pend ? '<span class="pill pending">' + pend + ' pending</span>' : '') + '</span>' +
      '<i class="fa-solid fa-chevron-down chev"></i></button><ul class="klist">' + rows + '</ul></div>';
  }
  function keysCol(envId) {
    var e = D.envs.filter(function (x) { return x.id === envId; })[0], list = S.keys[envId];
    return '<section class="kcol"><div class="kch"><h2>' + e.title + ' keys</h2><span class="chip"><i class="fa-solid fa-' + e.keyIcon + '"></i>' + e.keyType + '</span><span class="kcount">' + list.length + '</span></div>' +
      list.map(function (k) { return keyItem(k, envId); }).join('') + '</section>';
  }
  function keysPage() {
    return '<div class="wrap">' + pageHead('Keys', 'Keys you have created. Expand a key to see which APIs it can access and whether access is approved or pending.') +
      '<div class="kcols">' + keysCol('test') + keysCol('prod') + '</div></div>';
  }

  /* ---------- Services ---------- */
  function servicesPage() {
    return '<div class="wrap">' + pageHead('Services', 'Platform services you can request from the API team.') +
      '<div class="svcs">' + D.services.map(function (s) {
        var done = S.requested[s.id];
        return '<article class="svc"><div class="sicon"><i class="fa-solid fa-' + s.icon + '"></i></div><h3>' + s.title + '</h3><p>' + s.blurb + '</p>' +
          '<ul>' + s.points.map(function (p) { return '<li><i class="fa-solid fa-check"></i>' + p + '</li>'; }).join('') + '</ul>' +
          '<button class="btn lg' + (done ? ' ghost' : '') + '" data-svc="' + s.id + '"' + (done ? ' disabled' : '') + '>' + (done ? '<i class="fa-solid fa-check"></i>Requested' : 'Request service') + '</button></article>';
      }).join('') + '</div></div>';
  }

  /* ---------- Help ---------- */
  function helpPage() {
    return '<div class="wrap">' + pageHead('Help', 'Everything you need to go from finding an API to your first request.') +
      '<div class="hsteps">' + D.steps.map(function (s, i) { return '<div class="hstep"><span class="hn">' + (i + 1) + '</span><i class="fa-solid fa-' + s[0] + '"></i><b>' + s[1] + '</b><span>' + s[2] + '</span></div>'; }).join('') + '</div>' +
      '<div class="hcols"><section><h2 class="h2">Frequently asked questions</h2><div class="faq">' + D.faq.map(function (f) {
        return '<div class="fq"><button class="fqh" data-faq aria-expanded="false"><span>' + f[0] + '</span><i class="fa-solid fa-plus"></i></button><div class="fqa"><p>' + f[1] + '</p></div></div>';
      }).join('') + '</div></section>' +
      '<section><h2 class="h2">Get in touch</h2><div class="contacts">' + D.contacts.map(function (c) {
        return '<div class="ccard"><div class="sicon sm"><i class="fa-solid fa-' + c[0] + '"></i></div><div><b>' + c[1] + '</b><em>' + c[2] + '</em><p>' + c[3] + '</p><button class="btn ghost" data-nope="' + c[4] + '">' + c[4] + '</button></div></div>';
      }).join('') + '</div></section></div></div>';
  }

  /* ---------- render ---------- */
  function render() {
    header();
    var html = S.page === 'apis' ? catalog() : S.page === 'api' ? detail() : S.page === 'keys' ? keysPage() : S.page === 'services' ? servicesPage() : helpPage();
    $('#main').innerHTML = html;
    if (S.page === 'apis') { $('#sort').value = S.sort; renderGrid(); }
  }

  function go(page) { S.page = page; render(); window.scrollTo(0, 0); }
  function openApi(id) {
    S.api = id; S.tab = 'overview'; S.step = 1; S.env = 'test'; S.done = false; S.attached = false; S.attachBad = false; S.autoName = ''; S.f = emptyForm();
    go('api');
  }

  function validate(ids) {
    var ok = true;
    ids.forEach(function (id) {
      var el = $('#' + id), box = $('[data-f="' + id + '"]');
      var bad = !el.value.trim();
      if (id === 'callback' && !bad && !/^https?:\/\/.+/.test(el.value.trim())) { bad = true; $('.err', box).textContent = 'Enter a URL starting with https://'; }
      box.classList.toggle('bad', bad); if (bad) ok = false;
    });
    return ok;
  }

  function addKey() {
    var e = env(), a = cur(), pending = !e.immediate;
    var life = e.id === 'prod' ? 'Rotates every ' + S.f.expiry + ' days' : 'Expires after ' + S.f.expiry + ' days';
    S.keys[e.id].unshift({ id: 'n' + Date.now(), name: S.f.keyName, masked: (e.id === 'test' ? 'tst' : 'prd') + '_••••••••3f40', created: '16 Oct 2026', life: life, apis: [[a.id, pending ? 'pending' : 'approved', '16 Oct 2026']] });
  }

  function next() {
    if (S.step === 2 && !validate(['keyName'])) return;
    if (S.step === 3) {
      var ok = validate(['app', 'team', 'callback', 'usage']);
      S.attachBad = needsDoc() && !S.attached;
      if (!ok || S.attachBad) { if (S.attachBad && ok) { render(); } return; }
      addKey(); S.done = true; S.attachBad = false; render(); return;
    }
    S.step++; render();
  }

  /* ---------- tooltip ---------- */
  var tip = $('#tip');
  function showTip(el) {
    tip.innerHTML = '<b>' + esc(el.dataset.tipT) + '</b><span>' + esc(el.dataset.tipB) + '</span>';
    tip.classList.add('show');
    var r = el.getBoundingClientRect(), w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = (r.top - tip.offsetHeight - 8) + 'px';
  }
  document.addEventListener('mouseover', function (ev) { var el = ev.target.closest('[data-tip-t]'); if (el) showTip(el); });
  document.addEventListener('mouseout', function (ev) { if (ev.target.closest('[data-tip-t]')) tip.classList.remove('show'); });
  document.addEventListener('focusin', function (ev) { var el = ev.target.closest('[data-tip-t]'); if (el) showTip(el); });
  document.addEventListener('focusout', function () { tip.classList.remove('show'); });

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target, el;
    tip.classList.remove('show');
    if ((el = t.closest('[data-nope]'))) { ev.preventDefault(); toast(el.dataset.nope + ' is not part of this prototype'); return; }
    if ((el = t.closest('[data-link]'))) { ev.stopPropagation(); toast(el.dataset.link + ' is not part of this prototype'); return; }
    if ((el = t.closest('[data-nav]'))) { ev.preventDefault(); go(el.dataset.nav); return; }
    if ((el = t.closest('[data-open]'))) { openApi(el.dataset.open); return; }
    if ((el = t.closest('[data-chip]'))) { S.cat = el.dataset.chip; $('#chips').querySelectorAll('.fchip').forEach(function (c) { c.classList.toggle('on', c.dataset.chip === S.cat); }); renderGrid(); return; }
    if (t.closest('[data-clear]')) { S.q = ''; S.cat = 'All'; render(); return; }
    if ((el = t.closest('[data-key]'))) { var kb = el.closest('.key'); var o = kb.classList.toggle('open'); el.setAttribute('aria-expanded', o); return; }
    if ((el = t.closest('[data-faq]'))) { var fb = el.closest('.fq'); var fo = fb.classList.toggle('open'); el.setAttribute('aria-expanded', fo); return; }
    if ((el = t.closest('[data-svc]'))) {
      var s = D.services.filter(function (x) { return x.id === el.dataset.svc; })[0];
      S.requested[s.id] = true; render(); toast('“' + s.title + '” requested — the platform team will be in touch (fictional)'); return;
    }
    if ((el = t.closest('[data-tab]'))) { S.tab = el.dataset.tab; render(); return; }
    if ((el = t.closest('[data-env]'))) { S.env = el.dataset.env; render(); return; }
    if (t.closest('[data-next]')) { next(); return; }
    if (t.closest('[data-back]')) { S.step--; render(); return; }
    if (t.closest('[data-attach]')) { S.attached = !S.attached; S.attachBad = false; render(); return; }
    if (t.closest('[data-copy]')) { toast('Key copied (fictional)'); return; }
    if (t.closest('[data-restart]')) { S.step = 1; S.done = false; S.attached = false; S.autoName = ''; S.f = emptyForm(); render(); return; }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var el = ev.target.closest && ev.target.closest('[data-env]');
    if (el) { ev.preventDefault(); S.env = el.dataset.env; render(); var n = $('[data-env="' + S.env + '"]'); if (n) n.focus(); return; }
    el = ev.target.closest && ev.target.closest('.acard, .kapi');
    if (el) { ev.preventDefault(); openApi(el.dataset.open); }
  });
  document.addEventListener('input', function (ev) {
    var id = ev.target.id;
    if (id === 'q') { S.q = ev.target.value; renderGrid(); return; }
    if (id && id in S.f) { S.f[id] = ev.target.value; var box = ev.target.closest('.fld'); if (box) box.classList.remove('bad'); }
  });
  document.addEventListener('change', function (ev) {
    var id = ev.target.id;
    if (id === 'sort') { S.sort = ev.target.value; renderGrid(); return; }
    if (id && id in S.f) S.f[id] = ev.target.value;
  });

  render();
})();
