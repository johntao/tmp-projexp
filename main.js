const BADG_CLS_MAP = {
  '新專案': 'badge-green',
  '既有專案': 'badge-brown',
  '個人專案': 'badge-sideproj',
  'New Project': 'badge-green',
  'Existing Project': 'badge-brown',
  'Side Project': 'badge-sideproj',
};

function parseTSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split('\t');
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}

function renderTimeline(projects) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  const grouped = {};
  ERAs.forEach((_, i) => grouped[i] = []);
  projects.forEach(p => {
    const era = parseInt(p.era);
    if (grouped[era]) grouped[era].push(p);
  });

  ERAs.forEach((era, i) => {
    const eraDiv = document.createElement('div');
    eraDiv.className = 'era';
    eraDiv.innerHTML = `
<div class="era-header">
<h2>${era.name}</h2>
<div class="era-period">${era.period}</div>
</div>
    `;
    const projectsDiv = document.createElement('div');
    projectsDiv.className = 'era-projects';

    const sorted = grouped[i].sort((a, b) => parseInt(b.rank) - parseInt(a.rank));
    sorted.forEach(p => {
      const rank = parseInt(p.rank);
      const own = parseInt(p.own);
      const tags = p.tags ? JSON.parse(p.tags) : [];
      const badgeClass = BADG_CLS_MAP[p.badge1] || 'badge-green';

      const titleHtml = p.url
        ? `<a href="${p.url}" target="_blank">${p.title}</a>`
        : p.title;

      const classes = ['project', `significance-${rank}`];
      if (rank < 3) classes.push('hidden');
      if (!own) classes.push('not-owned');

      const div = document.createElement('div');
      div.className = classes.join(' ');
      div.dataset.r = rank;
      div.innerHTML = `
<div class="pj-header">
<span class="pj-title">${titleHtml}</span>
<div class="badges">
<span class="badge ${badgeClass}">${p.badge1}</span>
<span class="badge badge-secondary">${p.badge2}</span>
</div>
</div>
<div class="pj-category">${p.cat1}/${p.cat2}</div>
<div class="pj-desc">${p.desc}</div>
<div class="pj-tech">
${tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}
</div>
      `;
      projectsDiv.appendChild(div);
    });

    eraDiv.appendChild(projectsDiv);
    timeline.appendChild(eraDiv);
  });

  bindToggle();
}

function bindToggle() {
  const checkbox = document.getElementById('showAll');
  const hiddenProjects = document.querySelectorAll('.project[data-r="1"], .project[data-r="2"]');
  checkbox.addEventListener('change', function() {
    hiddenProjects.forEach(project => {
      project.classList.toggle('hidden', !this.checked);
    });
  });
}

renderTimeline(parseTSV(DATA_TSV));