/** San Carlos workshop. Static content, local work notes, no network calls. */
const PANELS = [
  ['fundamento', 'Fundamento'],
  ['qgis', 'En QGIS'],
  ['comprobar', 'Comprobación'],
  ['solucion', 'Solución'],
  ['expediente', 'Mi expediente'],
];
const STORAGE_PREFIX = 'san-carlos-taller:practica:v1:';
const memory = new Map();
const memoryProblems = new Map();
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const htmlId = value => String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
const textNumber = (value, decimals = 6) => new Intl.NumberFormat('es-CR', { maximumFractionDigits: decimals, useGrouping: false }).format(value);
const cleanTitle = title => String(title).replace(/^P0[1-6](?: resuelta)?\s*·\s*/, '');
const emptyState = () => ({ note: '', checks: {}, report: {}, s06: {}, reviewed: false, updatedAt: null });

/** A single comma or point is decimal; explicit three-digit grouping is validated. */
export function parsePracticeNumber(raw) {
  let value = String(raw ?? '').trim().replace(/^−/, '-');
  if (!value) return { ok: false, message: 'Escriba un resultado antes de comprobarlo.' };
  const error = { ok: false, message: 'Use un número con coma o punto decimal, sin unidades. Ejemplo: 335203,72. Si incluye miles, agrúpelos de tres en tres.' };
  if (/[\s\u00a0\u202f]/.test(value)) {
    if (!/^[+-]?\d{1,3}(?:[\s\u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(value)) return error;
    value = value.replace(/[\s\u00a0\u202f]/g,'');
  }
  if (value.includes('.') && value.includes(',')) {
    const decimal = value.lastIndexOf('.') > value.lastIndexOf(',') ? '.' : ',';
    const grouping = decimal === '.' ? ',' : '.';
    const escapedGrouping = grouping === '.' ? '\\.' : ',';
    const escapedDecimal = decimal === '.' ? '\\.' : ',';
    const pattern = new RegExp(`^[+-]?\\d{1,3}(?:${escapedGrouping}\\d{3})+${escapedDecimal}\\d+$`);
    if (!pattern.test(value)) return error;
    value = value.split(grouping).join('');
  } else {
    const separator = value.includes('.') ? '.' : value.includes(',') ? ',' : '';
    if (separator && value.split(separator).length > 2) {
      const escaped = separator === '.' ? '\\.' : ',';
      if (!new RegExp(`^[+-]?\\d{1,3}(?:${escaped}\\d{3})+$`).test(value)) return error;
      value = value.split(separator).join('');
    }
  }
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) {
    return error;
  }
  const number = Number(value.replace(',', '.'));
  if (!Number.isFinite(number)) return { ok: false, message: 'El número está fuera del intervalo admitido.' };
  return { ok: true, value: number };
}

export function evaluatePracticeNumber(raw, control) {
  const parsed = parsePracticeNumber(raw);
  if (!parsed.ok) return parsed;
  const difference = Math.abs(parsed.value - control.expected);
  const correct = difference <= control.tolerance + Number.EPSILON * Math.max(1, Math.abs(control.expected));
  return { ok: true, correct, value: parsed.value, difference };
}

function blockHTML(block, key) {
  const e = escapeHTML;
  switch (block.type) {
    case 'p': return `<p>${e(block.text)}</p>`;
    case 'h3': return `<h3>${e(block.text)}</h3>`;
    case 'list': return `<ul class="pw-list">${block.items.map(item => `<li>${e(item)}</li>`).join('')}</ul>`;
    case 'steps': return `<ol class="pw-steps">${block.items.map((item, i) => `<li><span class="pw-step-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div>${e(item)}</div></li>`).join('')}</ol>`;
    case 'table': return `<div class="pw-table-scroll" tabindex="0" role="region" aria-label="Tabla: ${e(block.headers.join(', '))}"><table><thead><tr>${block.headers.map(h => `<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${e(cell)}</th>` : `<td>${e(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'code': return `<div class="pw-code"><div class="pw-code-tools"><span>${block.role === 'calculation' ? 'Desarrollo' : 'Expresión'}</span><button type="button" class="pw-text-button" data-copy-code="${e(key)}">Copiar</button></div><pre id="${e(key)}"><code>${e(block.text)}</code></pre></div>`;
    default: return '';
  }
}

function renderGroups(practice, panel) {
  return (practice.panels[panel] || []).map((group, index) => {
    const section = practice.sections.find(s => s.id === group.sectionId);
    if (!section) return '';
    return `<article class="pw-reading" id="pw-${htmlId(practice.id)}-${htmlId(panel)}-${htmlId(section.id)}"><div class="pw-section-heading"><span class="pw-section-index">${String(index + 1).padStart(2, '0')}</span><h2>${escapeHTML(cleanTitle(section.title))}</h2></div>${group.blockIndices.map(i => blockHTML(section.blocks[i], `pw-code-${practice.id}-${panel}-${section.id}-${i}`)).join('')}</article>`;
  }).join('');
}

function figuresHTML(practice, panel) {
  const figures = (practice.figures || []).filter(f => f.panel === panel);
  if (!figures.length) return '';
  return `<div class="pw-figures">${figures.map(f => `<figure class="pw-figure"><button type="button" class="pw-figure-open" data-pw-figure="${escapeHTML(f.file)}" aria-label="Ampliar: ${escapeHTML(f.title)}"><img src="${escapeHTML(f.src)}" alt="${escapeHTML(f.title + '. ' + f.caption)}" loading="lazy" decoding="async"><span>Ampliar lámina ↗</span></button><figcaption><strong>${escapeHTML(f.title)}</strong><span>${escapeHTML(f.caption)}</span></figcaption></figure>`).join('')}</div>`;
}

function formulasHTML(formulas, practiceId) {
  const items = (formulas?.items || []).filter(f => f.practice === practiceId);
  if (!items.length) return '';
  return `<section class="pw-formulas" aria-labelledby="pw-formulas-title"><div class="pw-section-heading"><span class="pw-section-index">ƒ</span><h2 id="pw-formulas-title">Expresiones de la calculadora ráster</h2></div><p class="pw-help">Copie la expresión completa. Los nombres de las capas deben coincidir con los del proyecto. Mantenga EPSG:8908, resolución de 20 m y la extensión de los insumos.</p>${items.map(f => `<details class="pw-formula"><summary><code>${escapeHTML(f.id)}</code><span>Ver expresión</span></summary><div class="pw-formula-body"><div class="pw-formula-actions"><button type="button" class="pw-button pw-button-small" data-copy-formula="${escapeHTML(f.id)}">Copiar expresión</button><button type="button" class="pw-text-button" data-download-formula="${escapeHTML(f.id)}">Descargar TXT</button></div><pre><code>${escapeHTML(f.text)}</code></pre><p class="pw-help">Guardar resultado: <code>${escapeHTML(f.output)}</code></p></div></details>`).join('')}</section>`;
}

function checksHTML(practice) {
  if (!practice.checks.length) return `<section class="pw-review-criteria"><h2>Revisión de la entrega</h2><p>La lectura del informe requiere revisión técnica. Use estos criterios y registre la evidencia que respalda cada afirmación.</p><ul class="pw-list"><li>El mapa abarca los trece distritos y distingue NoData de un valor de índice igual a cero.</li><li>Los porcentajes identifican su denominador y las medias indican la superficie comparable.</li><li>Las observaciones conservan sitio, fechas, valores y condición de calidad.</li><li>S06 conserva el criterio previo de selección y la decisión por índice.</li><li>El informe relaciona dato observado, interpretación y comprobación pendiente.</li></ul><button type="button" class="pw-button" data-pw-panel-link="expediente">Redactar el informe y registrar S06 →</button></section>`;
  return `<section class="pw-checks" aria-labelledby="pw-checks-title"><div class="pw-section-heading"><span class="pw-section-index">=</span><h2 id="pw-checks-title">Contrastar sus resultados</h2></div><p class="pw-help">Introduzca sus resultados de QGIS o del cálculo manual. Use coma o punto decimal; escriba los miles sin separadores. Los controles verifican cantidades, no califican la interpretación del informe.</p><div class="pw-check-grid">${practice.checks.map(c => `<form class="pw-check-card" data-pw-check="${escapeHTML(c.id)}" novalidate><h3>${escapeHTML(c.label)}</h3><p>${escapeHTML(c.prompt)}</p><label class="pw-input-label" for="pw-check-${escapeHTML(c.id)}">Su resultado <span>${escapeHTML(c.unit)}</span></label><div class="pw-check-input"><input id="pw-check-${escapeHTML(c.id)}" name="result" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-check-input="${escapeHTML(c.id)}" aria-describedby="pw-check-help-${escapeHTML(c.id)} pw-check-result-${escapeHTML(c.id)}"><button type="submit" class="pw-button">Comprobar</button></div><p class="pw-help pw-tolerance" id="pw-check-help-${escapeHTML(c.id)}">${c.tolerance === 0 ? 'Se espera un número entero de días.' : `Tolerancia absoluta: ±${textNumber(c.tolerance)} ${escapeHTML(c.unit === 'sin unidad' ? '' : c.unit)}.`}</p><p class="pw-check-result" id="pw-check-result-${escapeHTML(c.id)}" role="status" aria-live="polite"></p><details class="pw-hint"><summary>Orientación del cálculo</summary><p>${escapeHTML(c.hint)}</p></details><details class="pw-hint pw-check-development"><summary>Consultar el desarrollo resuelto</summary><p>${escapeHTML(c.solution)}</p></details></form>`).join('')}</div></section>`;
}

function solutionsHTML(practice, solutions) {
  const solution = solutions.practices?.find(p => p.id === practice.id);
  const sections = solution?.sections || [];
  return `<div class="pw-solution-intro"><p class="pw-kicker">Resolución documentada</p><h2>Resultado, operación e interpretación</h2><p>Compare la decisión y el ámbito del cálculo. En una celda excluida, la coincidencia consiste en conservar NoData.</p></div>${sections.map((s, index) => `<details class="pw-solution"${index === 0 ? ' open' : ''}><summary><span class="pw-section-index">${String(index + 1).padStart(2, '0')}</span><span>${escapeHTML(cleanTitle(s.title))}</span></summary><div class="pw-solution-body">${s.blocks.map((b, i) => blockHTML(b, `pw-code-${practice.id}-solucion-${s.id}-${i}`)).join('')}</div></details>`).join('')}${figuresHTML(practice, 'solucion')}`;
}

const REPORT_FIELDS = [
  ['objetivo', 'Objeto y datos', 'Defina el ámbito, el propósito, las fuentes y las composiciones utilizadas.'],
  ['metodo', 'Procedimiento', 'Declare cuadrícula, criterios de aceptación, índices, superficie común y agregación distrital.'],
  ['resultados', 'Resultados territoriales', 'Abra con la superficie comparable. Incluya denominadores, medias y contraste entre dos distritos.'],
  ['comprobacion', 'Observaciones y comprobación', 'Relacione sitios, fechas, datos, interpretación y evidencia adicional necesaria.'],
];
const S06_OBSERVATIONS = [
  ['fecha', 'Fecha de adquisición', 'AAAA-MM-DD'], ['fuente', 'Código de fuente', 'Código dentro de la composición'],
  ['scl', 'SCL', 'Código de clase'], ['segura', 'Margen seguro', '0 o 1'],
  ['b03', 'B03 · verde', 'Reflectancia'], ['b04', 'B04 · rojo', 'Reflectancia'],
  ['b08', 'B08 · infrarrojo cercano', 'Reflectancia'], ['b11', 'B11 · onda corta', 'Reflectancia'],
];

function s06HTML(course) {
  return `<section class="pw-s06" aria-labelledby="pw-s06-title"><div class="pw-section-heading"><span class="pw-section-index">S06</span><h2 id="pw-s06-title">Sitio elegido por el participante</h2></div><p>Registre el criterio de elección antes de consultar los índices. S06 no tiene un valor numérico esperado: la evaluación consiste en poder reproducir la selección y la decisión.</p><details class="pw-s06-part" open><summary>1. Selección y centro de la celda</summary><div class="pw-field-grid"><label class="pw-field">Distrito con cobertura inferior al 40 %<select data-state-group="s06" data-state-field="distrito"><option value="">Seleccione el distrito</option>${course.s06Districts.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)} · ${textNumber(d.coveragePct, 2)} %</option>`).join('')}</select></label><label class="pw-field pw-field-wide">Criterio previo de selección<textarea rows="3" data-state-group="s06" data-state-field="criterio" placeholder="Indique por qué eligió esta celda junto al contacto entre áreas comparables y excluidas."></textarea></label><label class="pw-field">Coordenada E consultada, m<input type="text" inputmode="decimal" data-state-group="s06" data-state-field="e_consulta" placeholder="EPSG:8908"></label><label class="pw-field">Coordenada N consultada, m<input type="text" inputmode="decimal" data-state-group="s06" data-state-field="n_consulta" placeholder="EPSG:8908"></label><div class="pw-field-wide pw-coordinate-actions"><button type="button" class="pw-button" data-s06-center>Calcular centro de celda</button><p class="pw-help">E y N deben corresponder a CR-SIRGAS / CRTM05. El control comprueba la cuadrícula rectangular; confirme el distrito en QGIS.</p></div><label class="pw-field">Centro E, m<input type="text" data-state-group="s06" data-state-field="e_centro" readonly></label><label class="pw-field">Centro N, m<input type="text" data-state-group="s06" data-state-field="n_centro" readonly></label><p class="pw-coordinate-result pw-field-wide" role="status" aria-live="polite"></p><div class="pw-field-wide"><button type="button" class="pw-text-button" data-s06-csv>Descargar punto S06 como CSV</button></div></div></details><details class="pw-s06-part"><summary>2. Observaciones F1 y F2</summary><div class="pw-observation-grid">${['f1','f2'].map(comp => `<fieldset class="pw-observation"><legend>${comp.toUpperCase()}</legend>${S06_OBSERVATIONS.map(([key,label,placeholder]) => `<label class="pw-field">${escapeHTML(label)}<input type="text" data-state-group="s06" data-state-field="${comp}_${key}" placeholder="${escapeHTML(placeholder)}" ${['scl','segura','b03','b04','b08','b11'].includes(key) ? 'inputmode="decimal"' : ''}></label>`).join('')}</fieldset>`).join('')}</div></details><details class="pw-s06-part"><summary>3. Decisión e interpretación</summary><div class="pw-field-grid">${[['ndvi_decision','NDVI: aceptación o exclusión en F1 y F2'],['savi_decision','SAVI: aceptación o exclusión en F1 y F2'],['mndwi_decision','MNDWI: aceptación o exclusión en F1 y F2'],['comparacion','Resultado de F2 − F1 o motivo de NoData'],['observacion','Dato observado, unidad y fecha'],['interpretacion','Interpretación que admite el registro'],['comprobacion','Evidencia adicional para examinar una causa']].map(([key,label]) => `<label class="pw-field pw-field-wide">${escapeHTML(label)}<textarea rows="3" data-state-group="s06" data-state-field="${key}"></textarea></label>`).join('')}</div></details></section>`;
}

function notebookHTML(course, practice) {
  return `<section class="pw-notebook" aria-labelledby="pw-notebook-title"><div class="pw-section-heading"><span class="pw-section-index">${practice.id}</span><h2 id="pw-notebook-title">Registro de trabajo</h2></div><p>Conserve decisiones, cifras y rutas de sus resultados. Las notas permanecen en este navegador; exporte una copia para trasladarlas a otro equipo.</p><label class="pw-field">Notas de ${practice.id}<textarea class="pw-note" rows="9" data-state-group="note" placeholder="Dato y unidad · operación realizada · decisión · comprobación pendiente"></textarea></label><p class="pw-storage-status" role="status" aria-live="polite">Preparando el registro…</p>${practice.id === 'P06' ? `<section class="pw-report" aria-labelledby="pw-report-title"><h2 id="pw-report-title">Borrador del informe técnico</h2><p class="pw-help">Redacte de una a dos páginas con los cuatro apartados. Adjunte el mapa y el cuadro de los trece distritos.</p>${REPORT_FIELDS.map(([key,label,hint]) => `<label class="pw-field"><span class="pw-report-label">${escapeHTML(label)}</span><span class="pw-help">${escapeHTML(hint)}</span><textarea rows="6" data-state-group="report" data-state-field="${key}"></textarea></label>`).join('')}</section>${s06HTML(course)}` : ''}<div class="pw-notebook-export"><div><h3>Guardar una copia del expediente</h3><p class="pw-help">Incluye las notas y respuestas registradas en las seis prácticas en este navegador. El TXT puede abrirse en un editor de texto; el JSON conserva los campos por separado.</p></div><div class="pw-export-actions"><button type="button" class="pw-button" data-export="txt">Exportar TXT</button><button type="button" class="pw-button pw-button-secondary" data-export="json">Exportar JSON</button></div></div><label class="pw-reviewed"><input type="checkbox" data-state-group="reviewed"><span>He revisado esta práctica y documentado mis decisiones.<small>Marca personal de seguimiento; no constituye una evaluación.</small></span></label></section>`;
}

function sourcesHTML(practice, course, solutions) {
  const all = [...(course.sources || []), ...(solutions.sources || [])];
  const ids = new Set(practice.source_ids || []);
  const solution = solutions.practices?.find(p => p.id === practice.id);
  solution?.sections?.forEach(s => s.source_ids?.forEach(id => ids.add(id)));
  const seen = new Set();
  const sources = all.filter(s => ids.has(s.id) && !seen.has(s.id) && seen.add(s.id));
  return `<details class="pw-sources"><summary>Fuentes y archivos de referencia</summary><ul>${sources.map(s => `<li>${/^https?:\/\//.test(s.url) ? `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a>` : `<strong>${escapeHTML(s.title)}</strong><code>${escapeHTML(s.url)}</code>`}<p>${escapeHTML(s.use)}</p></li>`).join('')}</ul></details>`;
}

export function renderPractice(course, solutions, formulas, practiceId) {
  const practice = course.practices?.find(p => p.id === practiceId);
  if (!practice) return `<section class="practice-workspace"><h1>Práctica no encontrada</h1><p>Seleccione una de las seis prácticas del taller.</p><a href="#/practicas/P01">Abrir P01</a></section>`;
  const index = course.practices.indexOf(practice);
  const previous = course.practices[index - 1];
  const next = course.practices[index + 1];
  return `<div class="practice-workspace" data-practice="${practice.id}"><header class="pw-header"><div class="pw-breadcrumb"><a href="#/inicio">Taller San Carlos</a><span aria-hidden="true">/</span><span>Prácticas</span></div><div class="pw-kicker"><span>${practice.id} / 06</span><span>${practice.minutes} minutos</span></div><h1>${escapeHTML(practice.title)}</h1><p class="pw-question">${escapeHTML(practice.question)}</p><div class="pw-deliverable"><span>Producto de la práctica</span><strong>${escapeHTML(practice.deliverable)}</strong></div></header><div class="pw-context"><details><summary>Insumos y archivos de salida</summary><div class="pw-context-grid"><div><h2>Capas de entrada</h2><ul>${practice.inputs.map(v => `<li><code>${escapeHTML(v)}</code></li>`).join('')}</ul></div><div><h2>Guardar en el expediente</h2><ul>${practice.products.length ? practice.products.map(v => `<li><code>${escapeHTML(v)}</code></li>`).join('') : '<li>Hoja de respuestas y notas del proyecto.</li>'}</ul></div></div></details><a class="pw-resource-link" href="#/materiales">Datos y proyectos QGIS ↗</a></div><div class="pw-tabs" role="tablist" aria-label="Secciones de la práctica">${PANELS.map(([id,label],i) => `<button type="button" role="tab" id="pw-tab-${practice.id}-${id}" aria-controls="pw-panel-${practice.id}-${id}" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}" data-pw-tab="${id}"><span>${escapeHTML(label)}</span>${id === 'expediente' ? '<span class="pw-note-indicator" aria-hidden="true"></span>' : ''}</button>`).join('')}</div><div class="pw-panel" id="pw-panel-${practice.id}-fundamento" role="tabpanel" aria-labelledby="pw-tab-${practice.id}-fundamento" tabindex="0">${renderGroups(practice,'fundamento')}${figuresHTML(practice,'fundamento')}<button type="button" class="pw-button pw-next-panel" data-pw-panel-link="qgis">Continuar con el procedimiento →</button></div><div class="pw-panel" id="pw-panel-${practice.id}-qgis" role="tabpanel" aria-labelledby="pw-tab-${practice.id}-qgis" tabindex="0" hidden>${renderGroups(practice,'qgis')}${formulasHTML(formulas,practice.id)}${figuresHTML(practice,'qgis')}<button type="button" class="pw-button pw-next-panel" data-pw-panel-link="comprobar">Comprobar el trabajo →</button></div><div class="pw-panel" id="pw-panel-${practice.id}-comprobar" role="tabpanel" aria-labelledby="pw-tab-${practice.id}-comprobar" tabindex="0" hidden>${renderGroups(practice,'comprobar')}${checksHTML(practice)}${figuresHTML(practice,'comprobar')}</div><div class="pw-panel" id="pw-panel-${practice.id}-solucion" role="tabpanel" aria-labelledby="pw-tab-${practice.id}-solucion" tabindex="0" hidden>${solutionsHTML(practice,solutions)}</div><div class="pw-panel" id="pw-panel-${practice.id}-expediente" role="tabpanel" aria-labelledby="pw-tab-${practice.id}-expediente" tabindex="0" hidden>${notebookHTML(course,practice)}</div>${sourcesHTML(practice,course,solutions)}<nav class="pw-practice-navigation" aria-label="Continuar entre prácticas">${previous ? `<a href="#/practicas/${previous.id}"><small>← ${previous.id}</small><span>${escapeHTML(previous.title)}</span></a>` : '<span></span>'}${next ? `<a href="#/practicas/${next.id}"><small>${next.id} →</small><span>${escapeHTML(next.title)}</span></a>` : '<a href="#/materiales"><small>Materiales →</small><span>Guardar los productos del taller</span></a>'}</nav><div class="pw-action-status" role="status" aria-live="polite"></div><details class="pw-export-fallback" hidden><summary>Copiar contenido que no pudo descargarse</summary><textarea rows="12" readonly aria-label="Contenido para copiar"></textarea></details><dialog class="pw-image-dialog" aria-labelledby="pw-image-title"><div class="pw-dialog-header"><h2 id="pw-image-title"></h2><button type="button" class="pw-button pw-button-secondary" data-close-image>Cerrar ×</button></div><img alt=""><p></p></dialog></div>`;
}

function validState(value) {
  const state = emptyState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return state;
  state.note = typeof value.note === 'string' ? value.note : '';
  state.reviewed = value.reviewed === true;
  state.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null;
  for (const group of ['report','s06']) {
    if (value[group] && typeof value[group] === 'object' && !Array.isArray(value[group])) {
      for (const [key,text] of Object.entries(value[group])) {
        if (/^[a-z][a-z0-9_]*$/.test(key) && !['__proto__','constructor','prototype'].includes(key) && typeof text === 'string') state[group][key] = text;
      }
    }
  }
  if (value.checks && typeof value.checks === 'object' && !Array.isArray(value.checks)) {
    for (const [key,check] of Object.entries(value.checks)) {
      if (/^[a-z][a-z0-9_]*$/.test(key) && !['__proto__','constructor','prototype'].includes(key) && check && typeof check === 'object') {
        state.checks[key] = { raw: typeof check.raw === 'string' ? check.raw : '', checked: check.checked === true };
      }
    }
  }
  return state;
}

function getSavedState(practiceId) {
  if (memory.has(practiceId)) return { state: memory.get(practiceId), problem: memoryProblems.get(practiceId) || null };
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_PREFIX + practiceId);
    const state = stored ? validState(JSON.parse(stored)) : emptyState();
    memory.set(practiceId, state);
    return { state, problem: null };
  } catch (error) {
    const state = emptyState();
    memory.set(practiceId, state);
    const problem = 'No se pudo leer el registro guardado. Este trabajo se conserva temporalmente en la pestaña; exporte una copia.';
    memoryProblems.set(practiceId,problem);
    return { state, problem };
  }
}

function buildExport(course) {
  return {
    schemaVersion: 'san-carlos-expediente/1.0', workshop: course.title,
    exportedAt: new Date().toISOString(), scope: course.scenario,
    practices: course.practices.map(p => {
      const state = validState(getSavedState(p.id).state);
      return {
        id: p.id, title: p.title, note: state.note,
        checks: p.checks.map(c => {
          const input = state.checks[c.id] || { raw: '', checked: false };
          const evaluated = input.checked ? evaluatePracticeNumber(input.raw,c) : null;
          return { id: c.id, label: c.label, unit: c.unit, response: input.raw, checked: input.checked, numericMatch: evaluated?.ok ? evaluated.correct : null };
        }), report: state.report, s06: state.s06, reviewedByParticipant: state.reviewed, updatedAt: state.updatedAt,
      };
    }),
  };
}

function exportText(data) {
  const lines = [data.workshop, 'EXPEDIENTE DE PRÁCTICAS', `Exportado: ${data.exportedAt}`, data.scope, ''];
  for (const p of data.practices) {
    lines.push(`${p.id} · ${p.title}`, '', 'NOTAS', p.note || '(sin registro)', '');
    if (p.checks.length) {
      lines.push('CONTROLES NUMÉRICOS');
      for (const c of p.checks) lines.push(`${c.label}: ${c.response || '(sin respuesta)'} ${c.unit}. ${c.checked ? c.numericMatch === true ? 'Coincide con la referencia.' : c.numericMatch === false ? 'No coincide con la referencia.' : 'Entrada no válida.' : 'Sin comprobar.'}`);
      lines.push('');
    }
    if (p.id === 'P06') {
      lines.push('BORRADOR DEL INFORME');
      for (const [key,label] of REPORT_FIELDS) lines.push(label.toUpperCase(),p.report[key] || '(sin registro)','');
      lines.push('S06 · SITIO ELEGIDO POR EL PARTICIPANTE');
      const labels = { distrito:'Distrito', criterio:'Criterio previo', e_consulta:'E consultada, m', n_consulta:'N consultada, m', e_centro:'Centro E, m', n_centro:'Centro N, m', fila:'Fila (base 0)', columna:'Columna (base 0)', ndvi_decision:'Decisión NDVI', savi_decision:'Decisión SAVI', mndwi_decision:'Decisión MNDWI', comparacion:'Comparación o NoData', observacion:'Dato observado', interpretacion:'Interpretación', comprobacion:'Comprobación pendiente' };
      for (const comp of ['f1','f2']) for (const [key,label] of S06_OBSERVATIONS) labels[`${comp}_${key}`] = `${comp.toUpperCase()} · ${label}`;
      for (const [key,label] of Object.entries(labels)) lines.push(`${label}: ${p.s06[key] || '(sin registro)'}`);
      lines.push('S06 no dispone de una referencia numérica prefijada.','');
    }
    lines.push(`Revisión personal: ${p.reviewedByParticipant ? 'marcada' : 'pendiente'}`, '', '');
  }
  return lines.join('\n');
}

export function bindPractice(root, course, solutions, formulas, practiceId) {
  const workspace = root.matches?.('.practice-workspace') ? root : root.querySelector('.practice-workspace');
  const practice = course.practices?.find(p => p.id === practiceId);
  if (!workspace || !practice) return () => {};
  const initial = getSavedState(practiceId);
  const state = initial.state;
  let storageProblem = initial.problem;
  let active = true;
  let saveTimer;
  const listeners = [];
  const on = (element,event,fn) => { element.addEventListener(event,fn); listeners.push(() => element.removeEventListener(event,fn)); };
  const status = workspace.querySelector('.pw-action-status');
  const storageStatus = workspace.querySelector('.pw-storage-status');
  let announceTimer;
  const announce = text => {
    if (!active || !status) return;
    clearTimeout(announceTimer); status.textContent = text;
    announceTimer = setTimeout(() => { if (active) status.textContent = ''; },8500);
  };

  function updateStorageStatus() {
    if (!storageStatus) return;
    if (storageProblem) storageStatus.textContent = storageProblem;
    else storageStatus.textContent = state.updatedAt ? `Guardado en este navegador · ${new Date(state.updatedAt).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'})}. Exporte una copia para conservarla fuera de este equipo.` : 'Sus notas se guardarán en este navegador mientras escribe.';
    storageStatus.classList.toggle('pw-storage-warning', Boolean(storageProblem));
    workspace.querySelector('.pw-note-indicator')?.classList.toggle('has-note', Boolean(state.note || Object.values(state.report).some(Boolean) || Object.values(state.s06).some(Boolean)));
  }
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    state.updatedAt = new Date().toISOString();
    memory.set(practiceId,state);
    try {
      if (!globalThis.localStorage) throw new Error('Storage unavailable');
      globalThis.localStorage.setItem(STORAGE_PREFIX + practiceId,JSON.stringify(state));
      storageProblem = null;
    } catch (error) {
      storageProblem = 'El navegador no permite guardar estas notas de forma persistente. Permanecen en esta pestaña mientras esté abierta; exporte una copia antes de salir.';
    }
    memoryProblems.set(practiceId,storageProblem);
    updateStorageStatus();
  }
  function saveSoon() {
    memory.set(practiceId,state);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow,250);
  }
  function activatePanel(panel,focusPanel=false) {
    if (!PANELS.some(([id]) => id === panel)) return;
    workspace.querySelectorAll('[data-pw-tab]').forEach(tab => {
      const selected = tab.dataset.pwTab === panel;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex = selected ? 0 : -1;
      workspace.querySelector(`#pw-panel-${practiceId}-${tab.dataset.pwTab}`).hidden = !selected;
    });
    if (focusPanel) {
      const target = workspace.querySelector(`#pw-panel-${practiceId}-${panel}`);
      target.focus({preventScroll:true});
      workspace.querySelector('.pw-tabs').scrollIntoView?.({behavior:'smooth',block:'start'});
    }
  }
  function downloadText(text,filename,mime='text/plain;charset=utf-8') {
    let url;
    try {
      const blob = new Blob([text],{type:mime});
      url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = filename; anchor.hidden = true;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url),10000);
      announce(`Descarga preparada: ${filename}.`);
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      const fallback = workspace.querySelector('.pw-export-fallback');
      fallback.hidden = false; fallback.open = true;
      const field = fallback.querySelector('textarea'); field.value = text; field.focus(); field.select();
      announce('No se pudo iniciar la descarga. El contenido está seleccionado debajo para que pueda copiarlo.');
    }
  }
  async function copyText(text,button) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (!active) return;
      const original = button.textContent; button.textContent = 'Copiado';
      setTimeout(() => { if (button.isConnected) button.textContent = original; },1800);
      announce('Expresión copiada completa.');
    } catch (error) {
      if (!active) return;
      const field = document.createElement('textarea');
      field.value = text; field.setAttribute('aria-label','Expresión para copiar');
      field.className = 'pw-copy-fallback';
      button.closest('.pw-code, .pw-formula-body')?.append(field);
      field.focus(); field.select();
      announce('El navegador no permite copiar automáticamente. La expresión está seleccionada; utilice Copiar.');
    }
  }
  function showCheck(control,result) {
    const output = workspace.querySelector(`#pw-check-result-${control.id}`);
    const input = workspace.querySelector(`[data-check-input="${control.id}"]`);
    output.className = 'pw-check-result';
    if (!result.ok) {
      output.textContent = result.message; output.classList.add('pw-result-error'); input.setAttribute('aria-invalid','true'); return;
    }
    input.removeAttribute('aria-invalid');
    if (result.correct) {
      output.classList.add('pw-result-ok');
      output.textContent = control.tolerance === 0 ? 'Coincide con la referencia: intervalo correcto.' : `Coincide con la referencia dentro de la tolerancia. Diferencia absoluta: ${textNumber(result.difference,9)}.`;
    } else {
      output.classList.add('pw-result-mismatch');
      output.textContent = `No coincide con la referencia dentro de la tolerancia. ${control.hint}`;
    }
  }
  function populateFields() {
    workspace.querySelectorAll('[data-state-group]').forEach(field => {
      const group = field.dataset.stateGroup;
      if (group === 'note') field.value = state.note;
      else if (group === 'reviewed') field.checked = state.reviewed;
      else field.value = state[group]?.[field.dataset.stateField] || '';
    });
    for (const control of practice.checks) {
      const saved = state.checks[control.id];
      if (saved) {
        workspace.querySelector(`[data-check-input="${control.id}"]`).value = saved.raw;
        if (saved.checked) showCheck(control,evaluatePracticeNumber(saved.raw,control));
      }
    }
  }
  function centerS06() {
    const e = parsePracticeNumber(state.s06.e_consulta);
    const n = parsePracticeNumber(state.s06.n_consulta);
    const output = workspace.querySelector('.pw-coordinate-result');
    if (!e.ok || !n.ok) { output.textContent = 'Complete E y N como números sin separadores de miles antes de calcular.'; return; }
    const ec = 20 * Math.floor(e.value / 20) + 10;
    const nc = 20 * Math.floor(n.value / 20) + 10;
    if (ec < 405500 || ec >= 482400 || nc < 1132820 || nc >= 1215920) { output.textContent = 'La coordenada queda fuera de la cuadrícula entregada. Compruebe EPSG:8908 y el orden E / N.'; return; }
    state.s06.e_centro = String(ec); state.s06.n_centro = String(nc);
    state.s06.fila = String(Math.floor((1215920-nc)/20));
    state.s06.columna = String(Math.floor((ec-405500)/20));
    workspace.querySelector('[data-state-field="e_centro"]').value = state.s06.e_centro;
    workspace.querySelector('[data-state-field="n_centro"]').value = state.s06.n_centro;
    output.textContent = `Centro: E ${ec} m / N ${nc} m. Fila ${state.s06.fila}, columna ${state.s06.columna} (índices desde 0). Verifique el distrito y la calidad en QGIS.`;
    saveNow();
  }
  populateFields();
  updateStorageStatus();
  on(workspace,'click',event => {
    const button = event.target.closest('button');
    if (!button || !workspace.contains(button)) return;
    if (button.dataset.pwTab) activatePanel(button.dataset.pwTab);
    else if (button.dataset.pwPanelLink) activatePanel(button.dataset.pwPanelLink,true);
    else if (button.dataset.copyCode) copyText(workspace.querySelector(`#${button.dataset.copyCode}`)?.textContent || '',button);
    else if (button.dataset.copyFormula) {
      const f = formulas.items.find(item => item.id === button.dataset.copyFormula);
      if (f) copyText(f.text,button);
    } else if (button.dataset.downloadFormula) {
      const f = formulas.items.find(item => item.id === button.dataset.downloadFormula);
      if (f) downloadText(f.text,f.filename);
    } else if (button.dataset.export) {
      saveNow();
      const data = buildExport(course);
      const name = `Expediente_San_Carlos_${new Date().toISOString().slice(0,10)}`;
      if (button.dataset.export === 'json') downloadText(JSON.stringify(data,null,2)+'\n',name+'.json','application/json;charset=utf-8');
      else downloadText(exportText(data),name+'.txt');
    } else if (button.hasAttribute('data-s06-center')) centerS06();
    else if (button.hasAttribute('data-s06-csv')) {
      const ec = parsePracticeNumber(state.s06.e_centro); const nc = parsePracticeNumber(state.s06.n_centro);
      if (!ec.ok || !nc.ok || ec.value < 405500 || ec.value >= 482400 || nc.value < 1132820 || nc.value >= 1215920 || ec.value % 20 !== 10 || nc.value % 20 !== 10) { announce('Calcule primero un centro de celda válido para descargar S06.'); return; }
      downloadText(`id_sitio,x_8908,y_8908\nS06,${ec.value},${nc.value}\n`,'S06_centro_EPSG8908.csv','text/csv;charset=utf-8');
    } else if (button.dataset.pwFigure) {
      const figure = practice.figures.find(f => f.file === button.dataset.pwFigure);
      const dialog = workspace.querySelector('.pw-image-dialog');
      if (figure) {
        dialog.querySelector('h2').textContent = figure.title;
        dialog.querySelector('p').textContent = figure.caption;
        dialog.querySelector('img').src = figure.src;
        dialog.querySelector('img').alt = figure.title + '. ' + figure.caption;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else { dialog.setAttribute('open',''); dialog.querySelector('button').focus(); }
      }
    } else if (button.hasAttribute('data-close-image')) {
      const dialog = workspace.querySelector('.pw-image-dialog');
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    }
  });
  on(workspace,'keydown',event => {
    const tab = event.target.closest('[data-pw-tab]');
    if (tab && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();
      const tabs = [...workspace.querySelectorAll('[data-pw-tab]')];
      const current = tabs.indexOf(tab);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (current+(event.key === 'ArrowRight' ? 1 : -1)+tabs.length)%tabs.length;
      activatePanel(tabs[index].dataset.pwTab); tabs[index].focus();
    }
    if (event.key === 'Escape') {
      const dialog = workspace.querySelector('.pw-image-dialog');
      if (dialog.hasAttribute('open') && typeof dialog.close !== 'function') dialog.removeAttribute('open');
    }
  });
  on(workspace,'submit',event => {
    const form = event.target.closest('[data-pw-check]');
    if (!form) return;
    event.preventDefault();
    const control = practice.checks.find(c => c.id === form.dataset.pwCheck);
    const raw = form.querySelector('input').value;
    const result = evaluatePracticeNumber(raw,control);
    state.checks[control.id] = {raw,checked:true};
    showCheck(control,result); saveNow();
  });
  on(workspace,'input',event => {
    const field = event.target;
    if (field.dataset.checkInput) {
      const id = field.dataset.checkInput;
      state.checks[id] = {raw:field.value,checked:false};
      const output = workspace.querySelector(`#pw-check-result-${id}`);
      output.textContent = ''; output.className = 'pw-check-result'; field.removeAttribute('aria-invalid');
      saveSoon();
    } else if (field.dataset.stateGroup) {
      const group = field.dataset.stateGroup;
      if (group === 'note') state.note = field.value;
      else if (group === 'reviewed') state.reviewed = field.checked;
      else if (['s06','report'].includes(group)) {
        state[group][field.dataset.stateField] = field.value;
        if (group === 's06' && ['e_consulta','n_consulta'].includes(field.dataset.stateField)) {
          for (const key of ['e_centro','n_centro','fila','columna']) state.s06[key] = '';
          workspace.querySelector('[data-state-field="e_centro"]').value = '';
          workspace.querySelector('[data-state-field="n_centro"]').value = '';
          workspace.querySelector('.pw-coordinate-result').textContent = 'Coordenadas modificadas: vuelva a calcular el centro de celda.';
        }
      }
      saveSoon();
    }
  });
  const beforeLeave = () => { if (saveTimer) saveNow(); };
  on(globalThis,'pagehide',beforeLeave);
  return () => { if (saveTimer) saveNow(); active = false; listeners.forEach(remove => remove()); clearTimeout(saveTimer); clearTimeout(announceTimer); };
}
