/* Internal API catalog prototype — header, tabs and the 3-step "Get access" flow. All data is fictional (see data.js). */
(function () {
  var D = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var S = { tab: 'access', step: 1, env: 'test', done: false, attached: false, f: { keyName: '', expiry: '90', ip: '', app: '', team: '', callback: '', usage: '' } };
  var env = function () { return D.envs.filter(function (e) { return e.id === S.env; })[0]; };

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- header ---------- */
  function header() {
    $('#hdr').innerHTML =
      '<div class="logo" data-go="home"><b>API</b> <span>Portal</span></div>' +
      '<nav class="menu">' +
        '<a class="mi on" data-go="apis"><i class="fa-solid fa-plug"></i>APIs</a>' +
        '<a class="mi" data-nope="Keys"><i class="fa-solid fa-key"></i>Keys</a>' +
        '<a class="mi" data-nope="Services"><i class="fa-solid fa-handshake"></i>Services</a>' +
        '<a class="mi" data-nope="Help"><i class="fa-solid fa-circle-question"></i>Help</a>' +
      '</nav>' +
      '<div class="hdr-r"><button class="ib" data-nope="Profile" aria-label="Profile"><i class="fa-regular fa-user"></i></button><button class="ib" data-nope="Theme switching" aria-label="Theme"><i class="fa-regular fa-sun"></i></button></div>';
  }

  /* ---------- shell: title + tabs ---------- */
  function shell() {
    var tabs = [['overview', 'Overview'], ['docs', 'Documentation'], ['code', 'Code examples']];
    return '<div class="title-row"><h1>' + D.api.name + '</h1></div>' +
      '<div class="tabs-row"><button class="btn" data-tab="access" style="' + (S.tab === 'access' ? '' : 'background:transparent;border-top-color:transparent;color:#fff;border:1px solid rgba(255,255,255,.2)') + '">Get Access</button><span class="tdiv"></span>' +
      tabs.map(function (t) { return '<button class="tab' + (S.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '"><i class="fa-solid fa-compass"></i>' + t[1] + '</button>'; }).join('') +
      '</div><div class="rule"></div>';
  }

  /* ---------- tab content ---------- */
  function overview() {
    return '<div class="page plain"><section><h3>About this API</h3><p>' + D.api.name + ' ' + D.api.version + ' issues and validates the tokens every internal service uses to talk to the others. Owned by the ' + D.api.owner + '.</p></section>' +
      '<section><h3>Endpoints</h3><table class="tbl">' + D.endpoints.map(function (e) { return '<tr><td class="m">' + e[0] + '</td><td class="p">' + e[1] + '</td><td>' + e[2] + '</td></tr>'; }).join('') + '</table></section></div>';
  }
  function docs() {
    return '<div class="page plain"><section><h3>Documentation</h3><div class="dgrid">' + D.docs.map(function (d) { return '<div class="dcard" data-nope="This article"><b>' + d[0] + '</b><span>' + d[1] + '</span></div>'; }).join('') + '</div></section></div>';
  }
  function code() {
    return '<div class="page plain"><section><h3>Request a token</h3><pre class="code">curl -X POST https://api.example.internal/v2/token \\\n  -H "Content-Type: application/json" \\\n  -d \'{"<em>client_id</em>": "YOUR_APP_ID", "<em>client_secret</em>": "YOUR_KEY"}\'</pre></section></div>';
  }

  /* ---------- wizard ---------- */
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
      '<div class="envs" role="radiogroup">' + D.envs.map(envCard).join('') + '</div>';
  }

  function field(id, label, control, hint) {
    return '<div class="fld" data-f="' + id + '"><label for="' + id + '">' + label + '</label>' + control + (hint ? '<div class="hint">' + hint + '</div>' : '') + '<div class="err">This field is required.</div></div>';
  }

  function stepKey() {
    var e = env(), prod = e.id === 'prod';
    if (!S.f.keyName || /^auth-api-(test|prod)-key$/.test(S.f.keyName)) S.f.keyName = 'auth-api-' + e.id + '-key';
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

  function stepApp() {
    var prod = S.env === 'prod';
    return '<div class="hd"><h2>App info</h2><p>Tell us which application will use this key.</p></div>' +
      '<div class="panel">' +
        '<div class="row">' + field('app', 'Application name', '<input class="in" id="app" placeholder="e.g. Lab Inventory Web" value="' + esc(S.f.app) + '">') +
        field('team', 'Owning team', '<select class="in" id="team"><option value="">Select a team…</option>' + D.teams.map(function (t) { return '<option' + (S.f.team === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') + '</div>' +
        field('callback', 'Callback URL', '<input class="in" id="callback" placeholder="https://" value="' + esc(S.f.callback) + '">') +
        field('usage', 'How will you use the API?', '<textarea class="in" id="usage" placeholder="A sentence or two is enough.">' + esc(S.f.usage) + '</textarea>') +
        (prod ? '<div class="fld"><label>Integration Security Assessment</label><div class="attach' + (S.attached ? ' done' : '') + '" data-attach><i class="fa-solid fa-' + (S.attached ? 'circle-check' : 'paperclip') + '"></i><span>' + (S.attached ? 'security-assessment-v1.pdf attached' : 'Attach document (required for production)') + '</span></div><div class="err" style="display:' + (S.attachBad ? 'block' : 'none') + ';font-size:12px;color:#ffb4a0">Production access needs the assessment attached.</div></div>' : '') +
      '</div>';
  }

  function stepDone() {
    var e = env(), prod = e.id === 'prod';
    var body = prod
      ? '<div class="done-icon wait"><i class="fa-solid fa-hourglass-half"></i></div><div class="hd"><h2>Request submitted</h2><p>' + e.reviewer + ' will review your request. Expected processing time is about 2 weeks.</p></div>'
      : '<div class="done-icon"><i class="fa-solid fa-check"></i></div><div class="hd"><h2>Your key is ready</h2><p>Copy it now — for security we only show it once.</p></div>' +
        '<div class="panel" style="gap:12px"><div class="keybox"><span>tst_9f3a7c21e4b84d0f8a6e5b1c27d93f40</span><button class="btn ghost" data-copy>Copy</button></div></div>';
    return body +
      '<dl class="summary" style="width:640px"><dt>API</dt><dd>' + D.api.name + '</dd><dt>Environment</dt><dd>' + e.title + '</dd><dt>Key</dt><dd>' + esc(S.f.keyName) + ' · ' + e.keyType + '</dd><dt>Application</dt><dd>' + esc(S.f.app) + ' · ' + esc(S.f.team) + '</dd></dl>' +
      '<div class="foot" style="padding-top:0"><button class="btn ghost lg" data-restart>Request another key</button><button class="btn lg" data-tab="overview">Back to API</button></div>';
  }

  function wizard() {
    var inner = S.done ? stepDone() : S.step === 1 ? stepEnv() : S.step === 2 ? stepKey() : stepApp();
    var foot = S.done ? '' : '<div class="foot">' +
      (S.step > 1 ? '<button class="btn ghost lg" data-back><i class="fa-solid fa-chevron-left"></i>Back</button>' : '') +
      '<button class="btn lg" data-next><i class="fa-solid fa-' + (S.step === 3 ? 'paper-plane' : 'chevron-right') + '"></i>' + (S.step === 3 ? (S.env === 'prod' ? 'Submit request' : 'Get key') : 'Next') + '</button></div>';
    return '<div class="page">' + stepper() + inner + foot + '</div>';
  }

  /* ---------- render ---------- */
  function render() {
    var content = S.tab === 'overview' ? overview() : S.tab === 'docs' ? docs() : S.tab === 'code' ? code() : wizard();
    $('#main').innerHTML = shell() + content;
    $('#main').style.display = 'flex'; $('#main').style.flexDirection = 'column'; $('#main').style.flex = '1';
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

  function next() {
    if (S.step === 2 && !validate(['keyName'])) return;
    if (S.step === 3) {
      var ok = validate(['app', 'team', 'callback', 'usage']);
      S.attachBad = S.env === 'prod' && !S.attached;
      if (!ok || S.attachBad) { if (S.attachBad) render(), restoreErrors(); return; }
      S.done = true; S.attachBad = false; render(); return;
    }
    S.step++; render();
  }
  function restoreErrors() { validate(['app', 'team', 'callback', 'usage']); }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target, el;
    if ((el = t.closest('[data-nope]'))) { toast(el.dataset.nope + ' is not part of this prototype'); return; }
    if ((el = t.closest('[data-link]'))) { ev.stopPropagation(); toast(el.dataset.link + ' is not part of this prototype'); return; }
    if ((el = t.closest('[data-go]'))) { S.tab = 'access'; S.step = 1; S.done = false; render(); return; }
    if ((el = t.closest('[data-tab]'))) { S.tab = el.dataset.tab; render(); return; }
    if ((el = t.closest('[data-env]'))) { S.env = el.dataset.env; render(); return; }
    if (t.closest('[data-next]')) { next(); return; }
    if (t.closest('[data-back]')) { S.step--; render(); return; }
    if (t.closest('[data-attach]')) { S.attached = !S.attached; S.attachBad = false; render(); return; }
    if (t.closest('[data-copy]')) { toast('Key copied (fictional)'); return; }
    if (t.closest('[data-restart]')) { S.step = 1; S.done = false; S.attached = false; S.f = { keyName: '', expiry: '90', ip: '', app: '', team: '', callback: '', usage: '' }; render(); return; }
  });
  document.addEventListener('keydown', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-env]');
    if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); S.env = el.dataset.env; render(); var n = $('[data-env="' + S.env + '"]'); if (n) n.focus(); }
  });
  document.addEventListener('input', function (ev) {
    var id = ev.target.id;
    if (id && id in S.f) { S.f[id] = ev.target.value; var box = ev.target.closest('.fld'); if (box) box.classList.remove('bad'); }
  });
  document.addEventListener('change', function (ev) {
    var id = ev.target.id; if (id && id in S.f) S.f[id] = ev.target.value;
  });

  header();
  render();
})();
