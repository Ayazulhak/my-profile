/* Architecture diagrams v2: lane layout from architecture-data.json, inline SVG, CSS-animated request flow. */
(async function () {
  const svg = document.querySelector('[data-diagram-svg]');
  const list = document.querySelector('[data-arch-list]');
  const search = document.querySelector('[data-arch-search]');
  const filters = [...document.querySelectorAll('[data-arch-filters] .filter')];
  const titleEl = document.querySelector('[data-arch-title]');
  const metaEl = document.querySelector('[data-arch-meta]');
  const summaryEl = document.querySelector('[data-arch-summary]');
  const stepEl = document.querySelector('[data-arch-step]');
  const pauseBtn = document.querySelector('[data-arch-pause]');
  const nodesEl = document.querySelector('[data-arch-nodes]');
  if (!svg || !list) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LANES = ['ui', 'service', 'queue', 'worker', 'data'];
  const LANE_OF = { external: 'ui', ui: 'ui', service: 'service', queue: 'queue', worker: 'worker', data: 'data' };
  const LANE_LABEL = { ui: 'Clients', service: 'Services', queue: 'Messaging', worker: 'Workers', data: 'Data' };
  const ICON = {
    ui: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    external: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    service: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    queue: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="1.5"/><circle cx="14" cy="12" r="1.5"/><circle cx="10" cy="17" r="1.5"/>',
    worker: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
  };
  const W = 1200, NODE_W = 176, NODE_H = 64, LANE_GAP = 56, ROW_H = 100, TOP = 48;

  let data = [];
  try { data = await (await fetch('architecture-data.json')).json(); } catch (e) { if (titleEl) titleEl.textContent = 'The diagrams could not be loaded.'; return; }

  // Build the picker list.
  list.innerHTML = data.map(p => `<a class="arch-item" href="?project=${esc(p.id)}" data-id="${esc(p.id)}" data-group="${esc(p.group)}" data-featured="${p.featured ? 1 : 0}" data-text="${esc((p.title + ' ' + p.summary + ' ' + p.group).toLowerCase())}"><i class="dot ${esc(p.group)}"></i><span>${esc(p.title)}</span></a>`).join('');
  const items = [...list.children];
  let group = 'featured', query = '';
  function applyFilter() {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    items.forEach(el => {
      const inGroup = group === 'all' || (group === 'featured' ? el.dataset.featured === '1' : el.dataset.group === group);
      const ok = (words.length ? true : inGroup) && words.every(w => el.dataset.text.includes(w));
      el.hidden = !ok; if (ok) n++;
    });
    const c = document.querySelector('[data-arch-count]'); if (c) c.textContent = `${n} of ${data.length}`;
  }
  filters.forEach(b => b.addEventListener('click', () => { filters.forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); group = b.dataset.group; applyFilter(); }));
  if (search) search.addEventListener('input', () => { query = search.value; applyFilter(); });
  applyFilter();

  // Lane layout: lanes left to right in LANES order (only those present), nodes stacked by original y.
  function layout(project) {
    const present = LANES.filter(l => project.nodes.some(n => LANE_OF[n[4]] === l));
    const laneW = (W - LANE_GAP * (present.length - 1)) / present.length;
    const pos = {};
    const rowsByLane = {};
    present.forEach((lane, li) => {
      const ns = project.nodes.filter(n => LANE_OF[n[4]] === lane).sort((a, b) => a[3] - b[3]);
      rowsByLane[lane] = ns.length;
      ns.forEach((n, ri) => {
        pos[n[0]] = { x: li * (laneW + LANE_GAP) + (laneW - NODE_W) / 2, y: TOP + ri * ROW_H, lane: lane, row: ri, type: n[4], label: n[1] };
      });
    });
    const rows = Math.max(...Object.values(rowsByLane));
    // Vertically centre shorter lanes.
    present.forEach(lane => {
      const count = rowsByLane[lane];
      const offset = ((rows - count) * ROW_H) / 2;
      Object.values(pos).filter(p => p.lane === lane).forEach(p => { p.y += offset; });
    });
    const H = TOP + rows * ROW_H + 10;
    return { pos, present, laneW, H };
  }

  // Orthogonal path from the right edge of a to the left edge of b (or back if b is to the left).
  function edgePath(a, b) {
    const ax = a.x + NODE_W, ay = a.y + NODE_H / 2;
    const bx = b.x, by = b.y + NODE_H / 2;
    if (b.x <= a.x) {
      // backwards edge: route around via the bottom of both nodes
      const ax2 = a.x + NODE_W / 2, bx2 = b.x + NODE_W / 2;
      const yb = Math.max(a.y, b.y) + NODE_H + 18;
      return `M${ax2},${a.y + NODE_H} V${yb} H${bx2} V${b.y + NODE_H}`;
    }
    if (Math.abs(ay - by) < 1) return `M${ax},${ay} H${bx}`;
    const mx = ax + (bx - ax) / 2;
    return `M${ax},${ay} H${mx} V${by} H${bx}`;
  }

  let current = null, timer = null, step = 0, paused = false;

  function render(project) {
    current = project;
    const { pos, present, laneW, H } = layout(project);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.setProperty('--h', H);
    const lanes = present.map((lane, i) => {
      const x = i * (laneW + LANE_GAP);
      return `<text class="lane-label" x="${x + laneW / 2}" y="20" text-anchor="middle">${esc(LANE_LABEL[lane] || lane)}</text>` +
        (i ? `<line class="lane-line" x1="${x - LANE_GAP / 2}" y1="30" x2="${x - LANE_GAP / 2}" y2="${H}"/>` : '');
    }).join('');
    const edges = project.edges.map((e, i) => {
      const a = pos[e[0]], b = pos[e[1]]; if (!a || !b) return '';
      const d = edgePath(a, b);
      return `<g class="edge" data-i="${i}"><path class="edge-base" d="${d}"/><path class="edge-live" d="${d}"/><circle class="pkt" r="5" style="offset-path: path('${d}'); --d:${i * 0.35}s"/></g>`;
    }).join('');
    const labels = project.edges.map((e, i) => {
      const a = pos[e[0]], b = pos[e[1]]; if (!a || !b || !e[2]) return '';
      let x, y;
      if (b.x > a.x) { const ax = a.x + NODE_W, mx = ax + (b.x - ax) / 2; x = ax + (mx - ax) / 2 + 6; y = a.y + NODE_H / 2 - 9; }
      else { x = (a.x + b.x) / 2 + NODE_W / 2; y = Math.max(a.y, b.y) + NODE_H + 32; }
      return `<text class="edge-label" data-i="${i}" x="${x}" y="${y}" text-anchor="middle">${esc(e[2])}</text>`;
    }).join('');
    const wrap = label => {
      if (label.length <= 17) return [label];
      const words = label.split(' '); const lines = ['']; 
      words.forEach(w => { if ((lines[lines.length - 1] + ' ' + w).trim().length > 17 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); });
      return lines.slice(0, 2);
    };
    const nodes = project.nodes.map(n => {
      const p = pos[n[0]]; const lines = wrap(n[1]);
      const text = lines.length === 1
        ? `<text class="node-label" x="54" y="31">${esc(lines[0])}</text><text class="node-type" x="54" y="48">${esc(p.type)}</text>`
        : `<text class="node-label" x="54" y="28">${esc(lines[0])}</text><text class="node-label" x="54" y="46">${esc(lines[1])}</text>`;
      return `<g class="node ${esc(p.type)}" data-id="${esc(n[0])}" transform="translate(${p.x},${p.y})"><rect class="node-box" width="${NODE_W}" height="${NODE_H}" rx="10"/><rect class="node-ico-bg" x="10" y="15" width="34" height="34" rx="8"/><svg class="node-ico" x="17" y="22" width="20" height="20" viewBox="0 0 24 24">${ICON[p.type] || ICON.service}</svg>${text}</g>`;
    }).join('');
    svg.innerHTML = `<title>${esc(project.title)} architecture</title><g class="lanes">${lanes}</g><g class="edges">${edges}</g><g class="labels">${labels}</g><g class="nodes">${nodes}</g>`;
    if (titleEl) titleEl.textContent = project.title;
    if (summaryEl) summaryEl.textContent = project.summary;
    if (metaEl) metaEl.textContent = `System ${String(data.indexOf(project) + 1).padStart(2, '0')} of ${data.length} · ${project.group}`;
    if (nodesEl) nodesEl.innerHTML = project.nodes.map(n => `<span class="chip"><i class="dot ${esc(n[4])}" style="margin-right:.4rem"></i>${esc(n[1])}</span>`).join('');
    items.forEach(el => el.classList.toggle('is-active', el.dataset.id === project.id));
    document.title = `${project.title} | Architecture | Ayaz Ul Haq`;
    step = 0; highlight();
    schedule();
  }

  function highlight() {
    if (!current) return;
    const edges = svg.querySelectorAll('.edge'), labels = svg.querySelectorAll('.edge-label'), nodes = svg.querySelectorAll('.node');
    edges.forEach((g, i) => g.classList.toggle('is-active', i === step));
    labels.forEach(t => t.classList.toggle('is-active', Number(t.dataset.i) === step));
    nodes.forEach(n => n.classList.remove('is-active'));
    const e = current.edges[step];
    if (e) {
      svg.querySelector(`.node[data-id="${CSS.escape(e[0])}"]`)?.classList.add('is-active');
      svg.querySelector(`.node[data-id="${CSS.escape(e[1])}"]`)?.classList.add('is-active');
      if (stepEl) stepEl.textContent = `Request ${step + 1} of ${current.edges.length} · ${e[2] || ''}`;
    }
  }
  function schedule() {
    clearInterval(timer);
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(() => { step = (step + 1) % current.edges.length; highlight(); }, 1800);
  }
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('span').textContent = paused ? 'Play' : 'Pause';
    svg.classList.toggle('is-paused', paused);
    schedule();
  });
  const io = new IntersectionObserver(entries => { entries.forEach(en => { svg.classList.toggle('is-offscreen', !en.isIntersecting); if (!en.isIntersecting) clearInterval(timer); else schedule(); }); });
  io.observe(svg);

  list.addEventListener('click', e => {
    const a = e.target.closest('.arch-item'); if (!a) return;
    e.preventDefault();
    const p = data.find(x => x.id === a.dataset.id); if (!p) return;
    history.replaceState(null, '', `?project=${encodeURIComponent(p.id)}`);
    render(p);
    document.querySelector('[data-arch-panel]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const wanted = new URLSearchParams(location.search).get('project');
  render(data.find(p => p.id === wanted) || data[0]);
})();
