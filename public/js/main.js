(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Year */
  $('#yr').textContent = new Date().getFullYear();

  /* Theme (remembered in the browser) */
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('#theme').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* Mobile menu */
  const menu = $('#menu'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* Typing effect */
  const words = ['insights', 'ETL pipelines', 'ML models', 'live dashboards', 'cloud solutions'];
  const typed = $('#typed');
  let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 45 : 85);
  })();

  /* Skills – generated from CV data */
  const skills = [
    { t: 'Languages', e: '🐍', c: '#8b5cf6', i: ['Python', 'R', 'SQL'] },
    { t: 'Data & ETL', e: '🔄', c: '#ff4d8d', i: ['ETL Pipelines', 'Data Mining', 'Predictive Analytics', 'Data Validation', 'Data Modelling'] },
    { t: 'ML & AI', e: '🤖', c: '#22d3ee', i: ['NumPy', 'Pandas', 'PySpark', 'XGBoost', 'LightGBM', 'Deep Learning', 'Computer Vision', 'YOLO'] },
    { t: 'Cloud & DevOps', e: '☁️', c: '#3b82f6', i: ['Azure (AZ-204, AZ-900)', 'AWS', 'Amazon S3', 'Serverless'] },
    { t: 'Databases', e: '🗄️', c: '#ff9f43', i: ['PostgreSQL', 'Azure Cosmos DB', 'MongoDB', 'Neo4j'] },
    { t: 'Visualisation', e: '📊', c: '#a3e635', i: ['Tableau', 'Power BI', 'Apache Superset', 'MS Excel'] },
    { t: 'Tools & Platforms', e: '🛠️', c: '#d946ef', i: ['JIRA', 'Guidewire PolicyCenter', 'Linux', 'Windows', 'VS Code', 'Streamlit'] },
    { t: 'Ways of working', e: '🤝', c: '#f43f5e', i: ['Agile / Scrum', 'Sprint planning', 'Defect triage', 'UAT support', 'Cross-team collaboration'] },
  ];
  $('#skillGrid').innerHTML = skills.map(s =>
    `<div class="skill reveal" style="--c:${s.c}"><h3><em>${s.e}</em>${s.t}</h3><div class="chips">${s.i.map(x => `<span>${x}</span>`).join('')}</div></div>`
  ).join('');

  /* Reveal on scroll */
  $$('.card,.stage,.project,.win,.cert,.edu-grid>div,.resume-card,.kpi').forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* Counting numbers */
  function countUp(el, to, suffix = '') {
    const t0 = performance.now(), dur = 1400;
    (function f(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString() + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  const kio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { countUp(e.target, +e.target.dataset.count, e.target.dataset.suffix || ''); kio.unobserve(e.target); }
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => kio.observe(el));

  /* Resume download counter */
  const showCount = n => {
    $('#dl-count').textContent = n.toLocaleString();
    $('#kpi-dl').textContent = n.toLocaleString();
  };
  fetch('/api/downloads').then(r => r.json()).then(d => showCount(d.count)).catch(() => {
    $('#dl-count').parentElement.style.display = 'none';
    $('#kpi-dl').textContent = '–';
  });
  ['#dl-hero', '#dl-main'].forEach(sel => $(sel).addEventListener('click', () => {
    // the server counts the download; refresh the number a moment later
    setTimeout(() => fetch('/api/downloads').then(r => r.json()).then(d => showCount(d.count)).catch(() => {}), 1200);
  }));

  /* Contact form */
  const form = $('#contactForm'), msg = $('#formMsg'), btn = $('#sendBtn');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'form-msg';
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.message.trim().length < 5) {
      msg.textContent = 'Please enter your name, a valid email and a short message.';
      msg.classList.add('err'); return;
    }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      msg.textContent = '✅ Thank you! Your message has been sent – I\'ll reply soon.';
      msg.classList.add('ok'); form.reset();
    } catch (err) {
      msg.textContent = '⚠ ' + (err.message || 'Something went wrong.') + ' You can also email dhakshanabalsan@gmail.com';
      msg.classList.add('err');
    } finally { btn.disabled = false; btn.textContent = 'Send message ✈'; }
  });

  /* Data-network background (nodes + links, a nod to neural nets / graphs) */
  const cv = $('#bg'), ctx = cv.getContext('2d');
  let W, H, pts = [];
  const cols = ['#8b5cf6', '#ff4d8d', '#ff9f43', '#22d3ee', '#a3e635'];
  function size() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const n = Math.min(70, Math.floor(W * H / 22000));
    pts = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, c: cols[i % cols.length] }));
  }
  addEventListener('resize', size); size();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) { ctx.globalAlpha = (1 - d / 140) * .35; ctx.strokeStyle = a.c; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.globalAlpha = .9; ctx.fillStyle = pts[i].c; ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 2.4, 0, 6.3); ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  }
})();
