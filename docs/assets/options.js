import {esc,icon} from './shared.js';

const safeUrl = value => {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : '#';
  } catch {
    return '#';
  }
};

const external = (title, url) => `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener">${esc(title)} ${icon('external')}</a>`;

function routeCard(route) {
  return `<article class="technology-route" data-route-card="${esc(route.id)}">
    <header><span class="route-cost">${esc(route.cost)}</span><h2>${esc(route.label)}</h2><p>${esc(route.summary)}</p></header>
    <div class="route-components">${route.components.map(component => `<div><span>${esc(component.stage)}</span><strong>${esc(component.tools)}</strong><p>${esc(component.use)}</p></div>`).join('')}</div>
    <p class="route-condition"><strong>Condición:</strong> ${esc(route.condition)}</p>
  </article>`;
}

function equivalenceRows(items) {
  return items.map(item => `<tr>
    <th scope="row"><span>${esc(item.practice)}</span>${esc(item.objective)}</th>
    <td>${esc(item.open)}</td>
    <td>${esc(item.commercial)}</td>
    <td>${esc(item.output)}</td>
  </tr>`).join('');
}

function capabilityRows(items) {
  return items.map(item => `<tr>
    <th scope="row">${esc(item.area)}</th>
    <td>${item.open.map(tool => `<span>${esc(tool)}</span>`).join('')}</td>
    <td>${item.commercial.map(tool => `<span>${esc(tool)}</span>`).join('')}</td>
    <td>${esc(item.exchange)}</td>
  </tr>`).join('');
}

export function renderOptions(data) {
  return `<div class="shell wide technology-shell">
    <header class="page-intro technology-intro"><div><p class="eyebrow">Decisión tecnológica</p><h1>${esc(data.title)}</h1><p class="lead">${esc(data.subtitle)}</p></div><a class="button" href="#/practicas">Abrir las prácticas ${icon('arrow')}</a></header>
    <div class="technology-position">${icon('info')}<p>${esc(data.position)}</p></div>

    <section aria-labelledby="technology-principles"><div class="section-heading"><div><h2 id="technology-principles">Reglas para comparar</h2><p class="muted">La comparación utiliza el mismo dato, producto y control de aceptación.</p></div><span class="pill">Revisión ${esc(data.updated)}</span></div>
      <div class="technology-principles">${data.principles.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-space" aria-labelledby="technology-routes"><div class="section-heading"><div><h2 id="technology-routes">Tres rutas de implementación</h2><p class="muted">Seleccione una ruta para aislarla o compare las tres.</p></div></div>
      <div class="route-filter" role="group" aria-label="Filtrar rutas de implementación">
        <button type="button" class="is-active" data-route-filter="all" aria-pressed="true">Comparar todas</button>
        ${data.routes.map(route => `<button type="button" data-route-filter="${esc(route.id)}" aria-pressed="false">${esc(route.label)}</button>`).join('')}
      </div>
      <div class="technology-routes">${data.routes.map(routeCard).join('')}</div>
    </section>

    <section class="section-space" aria-labelledby="practice-equivalences"><div class="section-heading"><div><h2 id="practice-equivalences">Equivalencias para P01–P06</h2><p class="muted">Los nombres de las herramientas cambian; el resultado esperado y su comprobación se mantienen.</p></div></div>
      <div class="technology-table-wrap"><table class="technology-table"><thead><tr><th>Práctica</th><th>Software libre</th><th>Software comercial</th><th>Salida común</th></tr></thead><tbody>${equivalenceRows(data.practiceEquivalences)}</tbody></table></div>
    </section>

    <section class="section-space" aria-labelledby="capability-matrix"><div class="section-heading"><div><h2 id="capability-matrix">Matriz por capacidad</h2><p class="muted">Estas listas orientan una prueba técnica; no equivalen a una compra recomendada.</p></div></div>
      <div class="technology-table-wrap"><table class="technology-table capability-table"><thead><tr><th>Capacidad</th><th>Opciones libres</th><th>Opciones comerciales</th><th>Intercambio mínimo</th></tr></thead><tbody>${capabilityRows(data.capabilities)}</tbody></table></div>
    </section>

    <section class="section-space decision-section" aria-labelledby="decision-guide"><div><p class="eyebrow">Antes de adquirir o desplegar</p><h2 id="decision-guide">Cinco comprobaciones</h2><p>El piloto debe producir evidencia comparable. Una demostración del proveedor no sustituye un ensayo con los datos municipales.</p></div><ol>${data.decisionGuide.map(item => `<li><h3>${esc(item.question)}</h3><p><strong>Evidencia:</strong> ${esc(item.evidence)}</p></li>`).join('')}</ol></section>

    <section class="section-space related-projects" aria-labelledby="related-projects"><div class="section-heading"><div><h2 id="related-projects">Continuidad municipal</h2><p class="muted">El taller aporta la base de análisis; estos proyectos organizan su aplicación en catastro y gestión geoespacial.</p></div></div><div>${data.relatedProjects.map(project => `<article><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p>${external('Abrir proyecto', project.url)}</article>`).join('')}</div></section>

    <details class="technology-sources"><summary>${icon('info')} Fuentes oficiales de las herramientas y estándares</summary><div>${data.sources.map(source => `<p>${external(source.title, source.url)}<span>${esc(source.use)}</span></p>`).join('')}</div></details>
  </div>`;
}

export function bindOptions(root) {
  const buttons = [...root.querySelectorAll('[data-route-filter]')];
  const cards = [...root.querySelectorAll('[data-route-card]')];
  const listeners = [];
  for (const button of buttons) {
    const handler = () => {
      const selected = button.dataset.routeFilter;
      for (const candidate of buttons) {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      }
      for (const card of cards) card.hidden = selected !== 'all' && card.dataset.routeCard !== selected;
    };
    button.addEventListener('click', handler);
    listeners.push(() => button.removeEventListener('click', handler));
  }
  return () => listeners.forEach(dispose => dispose());
}
