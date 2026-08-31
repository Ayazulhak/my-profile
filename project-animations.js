(() => {
  const search = document.querySelector('[data-project-search]');
  const picker = document.querySelector('[data-project-picker]');
  const svg = document.querySelector('[data-diagram-svg]');
  if (!search || !picker || !svg) return;
  const state = { projects: [], filtered: [], selected: null, edge: 0, timer: null };
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const nodeMap = project => new Map(project.nodes.map(node => [node[0], node]));
  const center = node => ({ x: node[2] + 82, y: node[3] + 34 });
  function edgePath(from, to, index) {
    const a = center(from), b = center(to), dx = Math.abs(b.x - a.x);
    if (dx < 80) { const bend = 36 + (index % 3) * 18; return `M${a.x} ${a.y} C${a.x + bend} ${a.y},${b.x + bend} ${b.y},${b.x} ${b.y}`; }
    const mid = a.x + (b.x - a.x) * .5;
    return `M${a.x} ${a.y} C${mid} ${a.y},${mid} ${b.y},${b.x} ${b.y}`;
  }
  function wrapLabel(label) {
    const words = label.split(' '), lines = [''];
    words.forEach(word => { const current = lines[lines.length - 1]; if ((current + ' ' + word).trim().length > 20 && lines.length < 3) lines.push(word); else lines[lines.length - 1] = (current + ' ' + word).trim(); });
    return lines;
  }
  function renderDiagram() {
    const project = state.selected;
    if (!project) return;
    const nodes = nodeMap(project), markerId = `arrow-${project.id}`;
    const edgeMarkup = project.edges.map((edge, index) => {
      const from = nodes.get(edge[0]), to = nodes.get(edge[1]);
      if (!from || !to) return '';
      return `<g class="diagram-edge${index === state.edge ? ' is-active' : ''}" data-edge-index="${index}"><path d="${edgePath(from, to, index)}" marker-end="url(#${markerId})"/><text x="${(center(from).x + center(to).x) / 2}" y="${(center(from).y + center(to).y) / 2 - 8}">${esc(edge[2] || '')}</text></g>`;
    }).join('');
    const nodeMarkup = project.nodes.map(node => {
      const [id, label, x, y, kind = 'service'] = node, lines = wrapLabel(label);
      const text = lines.map((line, i) => `<tspan x="${x + 82}" dy="${i ? 17 : 0}">${esc(line)}</tspan>`).join('');
      return `<g class="diagram-node node-${esc(kind)}" data-node-id="${esc(id)}"><rect x="${x}" y="${y}" width="164" height="68" rx="14"/><circle cx="${x + 20}" cy="${y + 20}" r="6"/><text x="${x + 82}" y="${y + (lines.length === 1 ? 39 : lines.length === 2 ? 30 : 22)}" text-anchor="middle">${text}</text></g>`;
    }).join('');
    svg.innerHTML = `<title id="diagram-svg-title">${esc(project.title)} architecture</title><desc id="diagram-svg-desc">${esc(project.summary)}</desc><defs><marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${project.accent}"/></marker></defs><g class="edge-layer" style="--project-accent:${project.accent}">${edgeMarkup}</g><g class="node-layer">${nodeMarkup}</g>`;
    document.documentElement.style.setProperty('--diagram-accent', project.accent);
    document.querySelector('[data-project-title]').textContent = project.title;
    document.querySelector('[data-project-summary]').textContent = project.summary;
    document.querySelector('[data-project-number]').textContent = `Architecture ${String(state.projects.indexOf(project) + 1).padStart(2, '0')} of ${state.projects.length}`;
    document.querySelector('[data-accent-dot]').style.background = project.accent;
    renderConnection();
  }
  function renderConnection() {
    const project = state.selected;
    if (!project || !project.edges.length) return;
    state.edge %= project.edges.length;
    const edge = project.edges[state.edge], nodes = nodeMap(project), from = nodes.get(edge[0]), to = nodes.get(edge[1]);
    svg.querySelectorAll('.diagram-edge').forEach((element, index) => element.classList.toggle('is-active', index === state.edge));
    svg.querySelectorAll('.diagram-node').forEach(element => element.classList.remove('is-active'));
    svg.querySelector(`[data-node-id="${CSS.escape(edge[0])}"]`)?.classList.add('is-active');
    svg.querySelector(`[data-node-id="${CSS.escape(edge[1])}"]`)?.classList.add('is-active');
    document.querySelector('[data-step-number]').textContent = String(state.edge + 1);
    document.querySelector('[data-step-title]').textContent = `${from[1]} → ${to[1]}`;
    document.querySelector('[data-step-copy]').textContent = edge[2] ? `Connection purpose: ${edge[2]}.` : 'A project-specific system connection.';
    document.querySelector('[data-flow-step]').textContent = `Connection ${state.edge + 1} of ${project.edges.length}`;
  }
  function choose(project) { state.selected = project; state.edge = 0; picker.value = project.id; renderDiagram(); const url = new URL(location.href); url.searchParams.set('project', project.id); history.replaceState(null, '', url); }
  function applyFilter() {
    const term = search.value.trim().toLowerCase();
    const terms = term.split(/\s+/).filter(Boolean);
    const rank = project => {
      const title = project.title.toLowerCase();
      if (!term || title.startsWith(term)) return 0;
      if (title.includes(term)) return 1;
      if (terms.every(token => title.includes(token))) return 2;
      if (project.nodes.some(node => terms.some(token => node[1].toLowerCase().includes(token)))) return 3;
      return 4;
    };
    state.filtered = state.projects.filter(project => { const haystack = `${project.title} ${project.summary} ${project.nodes.map(n => n[1]).join(' ')}`.toLowerCase(); return terms.every(token => haystack.includes(token)); }).sort((a, b) => rank(a) - rank(b));
    picker.innerHTML = state.filtered.length ? state.filtered.map(project => `<option value="${esc(project.id)}">${esc(project.title)}</option>`).join('') : '<option value="">No matching projects</option>';
    document.querySelector('[data-result-count]').textContent = `${state.filtered.length} match${state.filtered.length === 1 ? '' : 'es'}`;
    if (state.filtered.length) choose(state.filtered[0]);
  }
  function next() { if (!state.selected) return; state.edge = (state.edge + 1) % state.selected.edges.length; renderConnection(); }
  search.addEventListener('input', applyFilter);
  search.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); picker.focus(); } if (event.key === 'Enter' && state.filtered[0]) { event.preventDefault(); choose(state.filtered[0]); } });
  picker.addEventListener('change', () => { const project = state.projects.find(item => item.id === picker.value); if (project) choose(project); });
  document.querySelector('[data-next]').addEventListener('click', next);
  document.querySelector('[data-play]').addEventListener('click', event => {
    if (state.timer) { clearInterval(state.timer); state.timer = null; event.currentTarget.textContent = 'Play flow'; }
    else { state.timer = setInterval(next, 1800); event.currentTarget.textContent = 'Pause flow'; }
  });
  fetch('architecture-data.json', { cache: 'no-store' }).then(response => { if (!response.ok) throw new Error(`Data request failed (${response.status})`); return response.json(); }).then(projects => { state.projects = projects; state.filtered = projects; const requested = new URLSearchParams(location.search).get('project'); const target = requested ? projects.find(project => project.id === requested || project.title === requested) : null; if (target) { picker.innerHTML = projects.map(project => `<option value="${esc(project.id)}">${esc(project.title)}</option>`).join(''); document.querySelector('[data-result-count]').textContent = `${projects.length} matches`; choose(target); } else applyFilter(); }).catch(error => { document.querySelector('[data-project-title]').textContent = 'Architecture data unavailable'; document.querySelector('[data-project-summary]').textContent = error.message; });
})();
