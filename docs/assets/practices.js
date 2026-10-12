/** San Carlos: guided QGIS tasks and a portable local workshop portfolio. */
const STORAGE_PREFIX = 'san-carlos-taller:practica:v1:';
const memory = new Map();
const memoryProblems = new Map();
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const htmlId = value => String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
const textNumber = (value, decimals = 6) => new Intl.NumberFormat('es-CR', { maximumFractionDigits: decimals, useGrouping: false }).format(value);
const cleanTitle = title => String(title).replace(/^P0[1-6](?: resuelta)?\s*·\s*/, '');
const emptyState = () => ({ note:'', checks:{}, report:{}, s06:{}, reviewed:false, updatedAt:null, workflowVersion:2, activeTask:null, completedTasks:[], taskNotes:{}, startedAt:null });

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


function checksHTML(practice) {
  if (!practice.checks.length) return `<section class="pw-review-criteria"><h2>Revisión de la entrega</h2><p>La lectura del informe requiere revisión técnica. Use estos criterios y registre la evidencia que respalda cada afirmación.</p><ul class="pw-list"><li>El mapa abarca los trece distritos y distingue NoData de un valor de índice igual a cero.</li><li>Los porcentajes identifican su denominador y las medias indican la superficie comparable.</li><li>Las observaciones conservan sitio, fechas, valores y condición de calidad.</li><li>S06 conserva el criterio previo de selección y la decisión por índice.</li><li>El informe relaciona dato observado, interpretación y comprobación pendiente.</li></ul><button type="button" class="pw-button" data-pw-panel-link="expediente">Redactar el informe y registrar S06 →</button></section>`;
  return `<section class="pw-checks" aria-labelledby="pw-checks-title"><div class="pw-section-heading"><span class="pw-section-index">=</span><h2 id="pw-checks-title">Contrastar sus resultados</h2></div><p class="pw-help">Introduzca sus resultados de QGIS o del cálculo manual. Use coma o punto decimal; escriba los miles sin separadores. Los controles verifican cantidades, no califican la interpretación del informe.</p><div class="pw-check-grid">${practice.checks.map(c => `<form class="pw-check-card" data-pw-check="${escapeHTML(c.id)}" novalidate><h3>${escapeHTML(c.label)}</h3><p>${escapeHTML(c.prompt)}</p><label class="pw-input-label" for="pw-check-${escapeHTML(c.id)}">Su resultado <span>${escapeHTML(c.unit)}</span></label><div class="pw-check-input"><input id="pw-check-${escapeHTML(c.id)}" name="result" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-check-input="${escapeHTML(c.id)}" aria-describedby="pw-check-help-${escapeHTML(c.id)} pw-check-result-${escapeHTML(c.id)}"><button type="submit" class="pw-button">Comprobar</button></div><p class="pw-help pw-tolerance" id="pw-check-help-${escapeHTML(c.id)}">${c.tolerance === 0 ? 'Se espera un número entero de días.' : `Tolerancia absoluta: ±${textNumber(c.tolerance)} ${escapeHTML(c.unit === 'sin unidad' ? '' : c.unit)}.`}</p><p class="pw-check-result" id="pw-check-result-${escapeHTML(c.id)}" role="status" aria-live="polite"></p><details class="pw-hint"><summary>Orientación del cálculo</summary><p>${escapeHTML(c.hint)}</p></details><details class="pw-hint pw-check-development"><summary>Consultar el desarrollo resuelto</summary><p>${escapeHTML(c.solution)}</p></details></form>`).join('')}</div></section>`;
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


function sourcesHTML(practice, course, solutions) {
  const all = [...(course.sources || []), ...(solutions.sources || [])];
  const ids = new Set(practice.source_ids || []);
  const solution = solutions.practices?.find(p => p.id === practice.id);
  solution?.sections?.forEach(s => s.source_ids?.forEach(id => ids.add(id)));
  const seen = new Set();
  const sources = all.filter(s => ids.has(s.id) && !seen.has(s.id) && seen.add(s.id));
  return `<details class="pw-sources"><summary>Fuentes y archivos de referencia</summary><ul>${sources.map(s => `<li>${/^https?:\/\//.test(s.url) ? `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a>` : `<strong>${escapeHTML(s.title)}</strong><code>${escapeHTML(s.url)}</code>`}<p>${escapeHTML(s.use)}</p></li>`).join('')}</ul></details>`;
}


function safeStringMap(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [key,text] of Object.entries(value)) {
    if (/^[a-z][a-z0-9_]*$/.test(key) && !['__proto__','constructor','prototype'].includes(key) && typeof text === 'string') result[key] = text;
  }
  return result;
}

function validState(value) {
  const state = emptyState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return state;
  state.note = typeof value.note === 'string' ? value.note : '';
  state.reviewed = value.reviewed === true;
  state.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null;
  state.startedAt = typeof value.startedAt === 'string' ? value.startedAt : null;
  state.workflowVersion = value.workflowVersion === 2 ? 2 : 1;
  state.activeTask = typeof value.activeTask === 'string' ? value.activeTask : null;
  state.completedTasks = Array.isArray(value.completedTasks) ? [...new Set(value.completedTasks.filter(x => typeof x === 'string'))] : [];
  state.report = safeStringMap(value.report);
  state.s06 = safeStringMap(value.s06);
  state.taskNotes = safeStringMap(value.taskNotes);
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
  if (memory.has(practiceId)) return memory.get(practiceId);
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_PREFIX + practiceId);
    const state = raw ? validState(JSON.parse(raw)) : emptyState();
    memory.set(practiceId,state);
    return state;
  } catch (error) {
    const state = emptyState();
    memory.set(practiceId,state);
    memoryProblems.set(practiceId,'No se pudo leer el registro guardado. Exporte una copia de su trabajo antes de cerrar esta pestaña.');
    return state;
  }
}

function stateForPractice(practice) {
  const state = getSavedState(practice.id);
  const tasks = practice.workflow.tasks;
  const ids = tasks.map(task => task.id);
  if (state.workflowVersion !== 2) {
    if (state.reviewed) state.completedTasks = [...ids];
    if (!state.startedAt && state.updatedAt) state.startedAt = state.updatedAt;
    state.workflowVersion = 2;
  }
  state.completedTasks = [...new Set(state.completedTasks.filter(id => ids.includes(id)))];
  if (!ids.includes(state.activeTask)) state.activeTask = ids.find(id => !state.completedTasks.includes(id)) || ids[0];
  state.reviewed = tasks.length > 0 && state.completedTasks.length === tasks.length;
  return state;
}

function hasWork(state) {
  return Boolean(state.startedAt || state.note || state.completedTasks.length || Object.values(state.checks).some(v => v.raw) || Object.values(state.report).some(Boolean) || Object.values(state.s06).some(Boolean) || Object.values(state.taskNotes).some(Boolean));
}

export function getWorkshopProgress(course) {
  const items = course.practices.map(practice => {
    const state = stateForPractice(practice);
    return { id:practice.id, reviewed:state.reviewed, started:hasWork(state), completedTasks:state.completedTasks.length, totalTasks:practice.workflow.tasks.length, activeTask:state.activeTask };
  });
  const recentlyWorked = items.filter(item => item.started && !item.reviewed).sort((a,b) => {
    const left = getSavedState(a.id), right = getSavedState(b.id);
    return (Date.parse(right.updatedAt || right.startedAt || '') || 0) - (Date.parse(left.updatedAt || left.startedAt || '') || 0);
  });
  const next = recentlyWorked[0] || items.find(item => !item.reviewed);
  return { total:items.length, reviewedCount:items.filter(x => x.reviewed).length, startedCount:items.filter(x => x.started).length, nextPracticeId:next?.id || null, items };
}

function signalProgress(practiceId) {
  const target = globalThis.window || globalThis;
  const EventType = target.CustomEvent || globalThis.CustomEvent;
  if (typeof target.dispatchEvent === 'function' && EventType) target.dispatchEvent(new EventType('sc-progress-change',{detail:{practiceId}}));
}

function persistState(practiceId,state) {
  state.updatedAt = new Date().toISOString();
  memory.set(practiceId,state);
  let problem = null;
  try {
    if (!globalThis.localStorage) throw new Error('Unavailable');
    globalThis.localStorage.setItem(STORAGE_PREFIX+practiceId,JSON.stringify(state));
  } catch (error) {
    problem = 'Este navegador no permite guardar de forma persistente. El trabajo permanece en esta pestaña; exporte una copia antes de salir.';
  }
  memoryProblems.set(practiceId,problem);
  signalProgress(practiceId);
  return problem;
}

function sourceBlock(course,practice,ref) {
  const section = [...practice.sections,...course.introduction].find(s => s.id === ref.sectionId);
  const original = section?.blocks[ref.blockIndex];
  if (!original) return null;
  return ref.itemIndices ? {...original,items:ref.itemIndices.map(i => original.items[i])} : original;
}

function referenceHTML(course,practice,refs,prefix) {
  return (refs || []).map((ref,index) => {
    const block = sourceBlock(course,practice,ref);
    return block ? blockHTML(block,`pw-${prefix}-${practice.id}-${index}`) : '';
  }).join('');
}

function formulaHTML(formulas,task,selectedId) {
  const items = task.formulaIds.map(id => formulas.items.find(f => f.id === id)).filter(Boolean);
  if (!items.length) return '';
  const selected = items.find(f => f.id === selectedId) || items[0];
  return `<section class="pw-inline-formula" aria-label="Expresión de esta tarea">
    <div class="pw-formula-heading"><span class="pw-label">Calculadora ráster</span>${items.length>1 ? `<label class="pw-formula-select">Expresión<select data-formula-select>${items.map(f=>`<option value="${escapeHTML(f.id)}"${f.id===selected.id?' selected':''}>${escapeHTML(f.id)}</option>`).join('')}</select></label>` : `<strong>${escapeHTML(selected.id)}</strong>`}</div>
    <pre><code>${escapeHTML(selected.text)}</code></pre>
    <div class="pw-formula-actions"><button type="button" class="pw-button" data-copy-formula="${escapeHTML(selected.id)}">Copiar para QGIS</button><button type="button" class="pw-text-button" data-download-formula="${escapeHTML(selected.id)}">Descargar TXT</button></div>
  </section>`;
}

function figureHTML(figure) {
  return `<figure class="pw-figure"><button type="button" class="pw-figure-open" data-pw-figure="${escapeHTML(figure.file)}" aria-label="Ampliar ${escapeHTML(figure.title)}"><img src="${escapeHTML(figure.src)}" alt="${escapeHTML(figure.title+'. '+figure.caption)}" loading="lazy" decoding="async"><span>Ampliar ↗</span></button><figcaption><strong>${escapeHTML(figure.title)}</strong><span>${escapeHTML(figure.caption)}</span></figcaption></figure>`;
}

function allSolutionSections(solutions) {
  return [...(solutions.introduction||[]),...solutions.practices.flatMap(p=>p.sections)];
}

function solutionSectionsHTML(sections,prefix) {
  return sections.map((section,index)=>`<details class="pw-solution-unit"><summary>${escapeHTML(cleanTitle(section.title))}</summary><div class="pw-reference-body">${section.blocks.map((b,i)=>blockHTML(b,`pw-solution-${prefix}-${index}-${i}`)).join('')}</div></details>`).join('');
}

function reportHTML() {
  return `<section class="pw-report" aria-labelledby="pw-report-title"><h3 id="pw-report-title">Borrador del informe</h3><p class="pw-help">Sus cuatro apartados se incluyen en las exportaciones TXT y JSON del expediente.</p>${REPORT_FIELDS.map(([key,label,hint])=>`<label class="pw-field"><span class="pw-report-label">${escapeHTML(label)}</span><span class="pw-help">${escapeHTML(hint)}</span><textarea rows="5" data-state-group="report" data-state-field="${key}"></textarea></label>`).join('')}</section>`;
}

function exportActionsHTML() {
  return `<div class="pw-export-block"><div><h3>Guardar una copia del expediente</h3><p class="pw-help">Incluye notas, respuestas, informe, S06 y avance de las seis prácticas.</p></div><div class="pw-export-actions"><button type="button" class="pw-button" data-export="txt">Exportar TXT</button><button type="button" class="pw-button pw-button-secondary" data-export="json">Exportar JSON</button></div><a class="pw-text-link" href="#/expediente">Abrir mi expediente →</a></div>`;
}

function outputHTML(paths) {
  return `<div class="pw-task-output"><span class="pw-label">Resultado de esta tarea</span>${paths.map((path,index)=>`<div class="pw-output-row"><code id="pw-output-${index}">${escapeHTML(path)}</code>${path.includes('/')?`<button type="button" class="pw-icon-button" data-copy-code="pw-output-${index}" aria-label="Copiar ruta ${escapeHTML(path)}">Copiar</button>`:''}</div>`).join('')}</div>`;
}

function taskHTML(course,practice,solutions,formulas,state) {
  const tasks=practice.workflow.tasks;
  const index=tasks.findIndex(t=>t.id===state.activeTask);
  const task=tasks[index];
  const done=state.completedTasks.includes(task.id);
  const figures=task.figureKeys.map(key=>practice.figures.find(f=>f.file===key)).filter(Boolean);
  const selectedSolutions=allSolutionSections(solutions).filter(s=>task.solutionSectionIds.includes(s.id));
  const checks=practice.checks.filter(c=>task.checkIds.includes(c.id));
  return `<article class="pw-active-task" data-active-task="${escapeHTML(task.id)}">
    <header class="pw-task-heading"><div class="pw-task-eyebrow"><span>Tarea ${index+1} de ${tasks.length}</span><span class="pw-task-status ${done?'is-reviewed':''}">${done?'Revisada por usted':'En trabajo'}</span></div><h2 id="pw-active-title" tabindex="-1">${escapeHTML(task.title)}</h2><p>${escapeHTML(task.goal)}</p></header>
    ${outputHTML(task.outputPaths)}
    <section class="pw-operation" aria-label="Procedimiento de la tarea"><div class="pw-operation-heading"><h3>${task.widget==='report'?'Prepare el informe':task.widget==='s06'?'Seleccione y documente el sitio':task.widget==='export'?'Revise los productos':'Realice la operación en QGIS'}</h3><span>${practice.id}</span></div>${referenceHTML(course,practice,task.sourceRefs,`task-${task.id}`)}</section>
    ${task.formulaIds.length?`<div class="pw-formula-slot">${formulaHTML(formulas,task)}</div>`:''}
    ${task.verificationRefs.length?`<section class="pw-verification"><h3>Qué debe comprobar</h3>${referenceHTML(course,practice,task.verificationRefs,`verify-${task.id}`)}</section>`:''}
    ${checks.length?checksHTML({...practice,checks}):''}
    ${task.widget==='s06'?s06HTML(course):task.widget==='report'?reportHTML():task.widget==='export'?exportActionsHTML():''}
    <div class="pw-task-aids">
      ${task.conceptRefs.length?`<details class="pw-aid"><summary>Fundamento de esta operación</summary><div class="pw-reference-body">${referenceHTML(course,practice,task.conceptRefs,`concept-${task.id}`)}</div></details>`:''}
      ${figures.length?`<details class="pw-aid pw-visual-aid"><summary>Consultar ${figures.length===1?'lámina':'láminas'} de referencia</summary><div class="pw-reference-body">${figures.map(figureHTML).join('')}</div></details>`:''}
      ${selectedSolutions.length?`<details class="pw-aid pw-solved-aid"><summary>Comparar con la resolución</summary><div class="pw-reference-body"><p class="pw-help">Revise operación, superficie y decisión de validez. Una celda excluida debe conservar NoData.</p>${solutionSectionsHTML(selectedSolutions,`${practice.id}-${task.id}`)}</div></details>`:''}
    </div>
    <section class="pw-task-record"><label class="pw-field"><span>Su registro de esta tarea</span><textarea rows="3" data-task-note="${escapeHTML(task.id)}" placeholder="Resultado con unidad · decisión tomada · comprobación pendiente"></textarea></label><details class="pw-general-note"${state.note?' open':''}><summary>Notas generales de ${practice.id}${state.note?' · hay notas guardadas':''}</summary><label class="pw-field"><span>Registro general de la práctica</span><textarea rows="4" data-state-group="note"></textarea></label></details><p class="pw-storage-status" role="status" aria-live="polite"></p></section>
    <footer class="pw-task-controls"><button type="button" class="pw-button pw-button-secondary" data-task-previous${index===0?' disabled':''}>← Anterior</button><div class="pw-task-primary">${done&&index===tasks.length-1?(state.reviewed?'<a class="pw-button pw-button-link" href="#/expediente">Abrir mi expediente →</a>':'<button type="button" class="pw-button" data-task-pending>Revisar tareas pendientes →</button>'):`<button type="button" class="pw-button" data-task-complete>${done?'Continuar →':index<tasks.length-1?'Marcar revisada y continuar →':'Marcar tarea revisada'}</button>`}${!done&&index<tasks.length-1?'<button type="button" class="pw-text-button" data-task-next>Continuar sin marcar</button>':''}${done?'<button type="button" class="pw-text-button" data-task-unreview>Volver a pendiente</button>':''}</div></footer>
    <p class="pw-review-disclosure">El avance lo marca usted al revisar cada tarea; no representa una calificación.</p>
  </article>`;
}

function taskListHTML(practice,state) {
  return practice.workflow.tasks.map((task,index)=>`<button type="button" class="pw-task-link ${state.activeTask===task.id?'is-active':''} ${state.completedTasks.includes(task.id)?'is-reviewed':''}" data-task-go="${escapeHTML(task.id)}" aria-label="Tarea ${index+1}: ${escapeHTML(task.title)}${state.completedTasks.includes(task.id)?', revisada':''}" ${state.activeTask===task.id?'aria-current="step"':''}><span class="pw-task-number">${state.completedTasks.includes(task.id)?'✓':String(index+1).padStart(2,'0')}</span><span>${escapeHTML(task.title)}</span></button>`).join('');
}

function manualHTML(course,practice,solutions,formulas) {
  const guideSections=[...(practice.id==='P01'?course.introduction.filter(s=>s.id!=='revision'):[]),...practice.sections,...(practice.id==='P06'?course.introduction.filter(s=>s.id==='revision'):[])];
  const solved=[...(practice.id==='P01'?solutions.introduction:[]),...(solutions.practices.find(p=>p.id===practice.id)?.sections||[])];
  const expressions=formulas.items.filter(f=>f.practice===practice.id);
  return `<section class="pw-reference-library" aria-labelledby="pw-reference-title"><h2 id="pw-reference-title">Material de consulta de ${practice.id}</h2><p>Consulte el procedimiento completo, las soluciones y las expresiones de QGIS.</p><details class="pw-library-group"><summary>Leer el cuaderno completo de esta práctica</summary><div class="pw-reference-body">${guideSections.map((s,index)=>`<section class="pw-manual-section"><h3>${escapeHTML(cleanTitle(s.title))}</h3>${s.blocks.map((b,i)=>blockHTML(b,`pw-manual-${practice.id}-${index}-${i}`)).join('')}</section>`).join('')}</div></details><details class="pw-library-group"><summary>Consultar todas las soluciones de ${practice.id}</summary><div class="pw-reference-body">${solutionSectionsHTML(solved,`${practice.id}-all`)}</div></details>${expressions.length?`<details class="pw-library-group"><summary>Expresiones y archivos TXT</summary><div class="pw-reference-body">${expressions.map(f=>`<details class="pw-formula-library"><summary><code>${escapeHTML(f.id)}</code></summary><div class="pw-reference-body"><pre><code>${escapeHTML(f.text)}</code></pre><button type="button" class="pw-button" data-copy-formula="${escapeHTML(f.id)}">Copiar para QGIS</button> <button type="button" class="pw-text-button" data-download-formula="${escapeHTML(f.id)}">Descargar TXT</button></div></details>`).join('')}</div></details>`:''}${sourcesHTML(practice,course,solutions)}</section>`;
}

function utilityHTML() {
  return `<div class="pw-action-status" role="status" aria-live="polite"></div><details class="pw-export-fallback" hidden><summary>Copiar contenido que no pudo descargarse</summary><textarea rows="12" readonly aria-label="Contenido para copiar"></textarea></details><dialog class="pw-image-dialog" aria-labelledby="pw-image-title"><div class="pw-dialog-header"><h2 id="pw-image-title"></h2><button type="button" class="pw-button pw-button-secondary" data-close-image>Cerrar ×</button></div><img alt=""><p></p></dialog>`;
}

export function renderPractice(course,solutions,formulas,practiceId) {
  const practice=course.practices.find(p=>p.id===practiceId);
  if(!practice)return '<section class="practice-workspace"><h1>Práctica no encontrada</h1><a href="#/practicas/P01">Abrir P01</a></section>';
  const state=stateForPractice(practice);
  const next=course.practices[course.practices.indexOf(practice)+1];
  return `<div class="practice-workspace" data-practice="${practice.id}">
    <header class="pw-header"><div class="pw-heading-meta"><a href="#/inicio">← Workshop San Carlos</a><span>${practice.id} · ${practice.minutes} min</span></div><h1>${escapeHTML(practice.title)}</h1><p>${escapeHTML(practice.question)}</p><div class="pw-practice-product"><span class="pw-label">Al terminar</span><strong>${escapeHTML(practice.deliverable)}</strong></div></header>
    <div class="pw-guided-layout"><aside class="pw-route" aria-label="Recorrido de ${practice.id}"><div class="pw-route-heading"><h2>Recorrido de trabajo</h2><span class="pw-count-text">${state.completedTasks.length} / ${practice.workflow.tasks.length}</span></div><progress class="pw-progress" max="${practice.workflow.tasks.length}" value="${state.completedTasks.length}" aria-label="Tareas revisadas"></progress><div class="pw-task-list">${taskListHTML(practice,state)}</div><div class="pw-route-resources"><a href="#/materiales">Datos y proyectos QGIS ↗</a><a href="#/expediente">Mi expediente →</a></div><p class="pw-route-note">Ejecute las operaciones en QGIS y registre aquí sus resultados.</p></aside>
    <div class="pw-work-column"><div class="pw-task-content">${taskHTML(course,practice,solutions,formulas,state)}</div><section class="pw-practice-complete"${state.reviewed?'':' hidden'}><span class="pw-label">Recorrido revisado</span><h2>Ha revisado las tareas de ${practice.id}</h2><p>Sus marcas y notas están en el expediente. Puede volver a cualquier tarea para contrastar el resultado.</p><a class="pw-button pw-button-link" href="${next?'#/practicas/'+next.id:'#/expediente'}">${next?'Continuar con '+next.id:'Abrir mi expediente'} →</a></section>${manualHTML(course,practice,solutions,formulas)}</div></div>${utilityHTML()}
  </div>`;
}

function portfolioItemsHTML(course) {
  return course.practices.map(practice=>{
    const state=stateForPractice(practice);
    const filledChecks=practice.checks.filter(c=>state.checks[c.id]?.raw).length;
    const taskNotes=practice.workflow.tasks.filter(t=>state.taskNotes[t.id]);
    const noteCount=taskNotes.length+(state.note?1:0);
    const task=practice.workflow.tasks.find(t=>t.id===state.activeTask);
    return `<article class="pw-portfolio-card"><div class="pw-portfolio-card-top"><span class="pw-practice-code">${practice.id}</span><span class="pw-portfolio-status ${state.reviewed?'is-reviewed':''}">${state.reviewed?'Revisada':hasWork(state)?'En trabajo':'Sin iniciar'}</span></div><h2>${escapeHTML(practice.title)}</h2><p class="pw-help">${state.completedTasks.length} de ${practice.workflow.tasks.length} tareas revisadas · ${filledChecks} controles registrados · ${noteCount} notas</p><progress class="pw-progress" max="${practice.workflow.tasks.length}" value="${state.completedTasks.length}" aria-label="Tareas revisadas de ${practice.id}"></progress><a class="pw-text-link" href="#/practicas/${practice.id}">${hasWork(state)?'Reanudar: '+escapeHTML(task.title):'Comenzar la práctica'} →</a><details class="pw-portfolio-notes"><summary>Notas y registro</summary>${state.note?`<p class="pw-note-label">Nota general</p><p class="pw-saved-text">${escapeHTML(state.note)}</p>`:''}${taskNotes.map(t=>`<p class="pw-note-label">${escapeHTML(t.title)}</p><p class="pw-saved-text">${escapeHTML(state.taskNotes[t.id])}</p>`).join('')}${!state.note&&!taskNotes.length?'<p class="pw-help">Las notas aparecerán aquí al guardarlas durante la práctica.</p>':''}${practice.id==='P06'?`<p class="pw-help">Informe: ${REPORT_FIELDS.filter(([key])=>state.report[key]).length} de 4 apartados con texto. S06: ${state.s06.distrito?escapeHTML(state.s06.distrito):'sin distrito registrado'}.</p>`:''}</details></article>`;
  }).join('');
}

export function renderPortfolio(course,solutions,formulas) {
  const progress=getWorkshopProgress(course);
  return `<div class="practice-workspace pw-portfolio"><header class="pw-header"><div class="pw-heading-meta"><a href="#/inicio">← Workshop San Carlos</a><span>Mi trabajo</span></div><h1>Mi expediente</h1><p>Revise el avance, recupere sus notas y guarde una copia para continuar en otro equipo.</p></header><div class="pw-portfolio-summary"><div><strong class="pw-portfolio-reviewed">${progress.reviewedCount} / ${progress.total}</strong><span>prácticas revisadas</span></div><div><strong class="pw-portfolio-started">${progress.startedCount}</strong><span>prácticas iniciadas</span></div><a class="pw-button pw-button-link" href="${progress.nextPracticeId?'#/practicas/'+progress.nextPracticeId:'#/practicas/P06'}">${progress.nextPracticeId?'Continuar mi trabajo':'Revisar la entrega'} →</a></div><section class="pw-portfolio-transfer"><div><h2>Guardar y trasladar el expediente</h2><p>El TXT contiene un registro legible. El JSON conserva los campos y permite restaurarlos en este taller.</p><div class="pw-export-actions"><button type="button" class="pw-button" data-export="txt">Exportar TXT</button><button type="button" class="pw-button pw-button-secondary" data-export="json">Exportar JSON</button></div></div><div class="pw-import-box"><h3>Continuar con un archivo guardado</h3><p class="pw-help">Seleccione un JSON exportado desde el taller. Se mostrará su contenido antes de reemplazar registros.</p><label class="pw-file-label">Seleccionar expediente JSON<input type="file" accept=".json,application/json" data-import-file></label><p class="pw-import-status" role="status" aria-live="polite"></p></div></section><section class="pw-import-preview" hidden aria-labelledby="pw-import-preview-title"></section><p class="pw-portfolio-storage pw-help">El registro se guarda en este navegador. La exportación permite conservar una copia fuera de este equipo.</p><div class="pw-portfolio-items">${portfolioItemsHTML(course)}</div>${utilityHTML()}</div>`;
}

function buildExport(course) {
  return {
    schemaVersion:'san-carlos-expediente/2.0',workshop:course.title,
    exportedAt:new Date().toISOString(),scope:course.scenario,
    practices:course.practices.map(practice=>{
      const state=stateForPractice(practice);
      return {
        id:practice.id,title:practice.title,note:state.note,
        checks:practice.checks.map(control=>{
          const input=state.checks[control.id]||{raw:'',checked:false};
          const result=input.checked?evaluatePracticeNumber(input.raw,control):null;
          return {id:control.id,label:control.label,unit:control.unit,response:input.raw,checked:input.checked,numericMatch:result?.ok?result.correct:null};
        }),
        report:{...state.report},s06:{...state.s06},reviewedByParticipant:state.reviewed,
        workflowVersion:2,activeTask:state.activeTask,completedTasks:[...state.completedTasks],taskNotes:{...state.taskNotes},startedAt:state.startedAt,updatedAt:state.updatedAt,
      };
    }),
  };
}

function exportText(data,course) {
  const lines=[data.workshop,'EXPEDIENTE DE PRÁCTICAS',`Exportado: ${data.exportedAt}`,data.scope,''];
  for(const p of data.practices){
    const practice=course.practices.find(x=>x.id===p.id);
    lines.push(`${p.id} · ${p.title}`,'',`Tareas revisadas por el participante: ${p.completedTasks.length} de ${practice.workflow.tasks.length}`,'','NOTA GENERAL',p.note||'(sin registro)','');
    lines.push('RECORRIDO DE TAREAS');
    for(const task of practice.workflow.tasks)lines.push(`${p.completedTasks.includes(task.id)?'Revisada':'Pendiente'} · ${task.title}`,p.taskNotes[task.id]||'(sin nota)','');
    if(p.checks.length){
      lines.push('CONTROLES NUMÉRICOS');
      for(const control of p.checks)lines.push(`${control.label}: ${control.response||'(sin respuesta)'} ${control.unit}. ${control.checked?control.numericMatch===true?'Coincide con la referencia.':control.numericMatch===false?'No coincide con la referencia.':'Entrada no válida.':'Sin comprobar.'}`);
      lines.push('');
    }
    if(p.id==='P06'){
      lines.push('BORRADOR DEL INFORME');
      for(const [key,label]of REPORT_FIELDS)lines.push(label.toUpperCase(),p.report[key]||'(sin registro)','');
      lines.push('S06 · SITIO ELEGIDO POR EL PARTICIPANTE');
      const labels={distrito:'Distrito',criterio:'Criterio previo',e_consulta:'E consultada, m',n_consulta:'N consultada, m',e_centro:'Centro E, m',n_centro:'Centro N, m',fila:'Fila (base 0)',columna:'Columna (base 0)',ndvi_decision:'Decisión NDVI',savi_decision:'Decisión SAVI',mndwi_decision:'Decisión MNDWI',comparacion:'Comparación o NoData',observacion:'Dato observado',interpretacion:'Interpretación',comprobacion:'Comprobación pendiente'};
      for(const comp of ['f1','f2'])for(const[key,label]of S06_OBSERVATIONS)labels[`${comp}_${key}`]=`${comp.toUpperCase()} · ${label}`;
      for(const[key,label]of Object.entries(labels))lines.push(`${label}: ${p.s06[key]||'(sin registro)'}`);
      lines.push('S06 no dispone de una referencia numérica prefijada.','');
    }
    lines.push('');
  }
  return lines.join('\n');
}

function createUtility(workspace,course,formulas,beforeExport=()=>{}) {
  let active=true;
  let statusTimer;
  const status=workspace.querySelector('.pw-action-status');
  const announce=text=>{
    if(!active||!status)return;
    clearTimeout(statusTimer);status.textContent=text;
    statusTimer=setTimeout(()=>{if(active)status.textContent='';},8500);
  };
  function downloadText(text,filename,mime='text/plain;charset=utf-8'){
    let url;
    try{
      url=URL.createObjectURL(new Blob([text],{type:mime}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.hidden=true;
      document.body.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      announce(`Descarga preparada: ${filename}.`);
    }catch(error){
      if(url)URL.revokeObjectURL(url);
      const fallback=workspace.querySelector('.pw-export-fallback');fallback.hidden=false;fallback.open=true;
      const field=fallback.querySelector('textarea');field.value=text;field.focus();field.select();
      announce('No se pudo iniciar la descarga. El contenido queda seleccionado para que pueda copiarlo.');
    }
  }
  async function copyText(text,button){
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Unavailable');
      await navigator.clipboard.writeText(text);
      if(!active)return;
      const original=button.textContent;button.textContent='Copiado';
      setTimeout(()=>{if(button.isConnected)button.textContent=original;},1600);
      announce('Contenido copiado completo.');
    }catch(error){
      if(!active)return;
      const target=button.closest('.pw-inline-formula,.pw-code,.pw-reference-body,.pw-output-row')||button.parentElement;
      target.querySelector('.pw-copy-fallback')?.remove();
      const field=document.createElement('textarea');field.className='pw-copy-fallback';field.value=text;field.setAttribute('aria-label','Contenido para copiar');
      target.append(field);field.focus();field.select();
      announce('El navegador no permite copiar automáticamente. El texto está seleccionado; utilice Copiar.');
    }
  }
  function click(button){
    if(button.dataset.copyCode){copyText(workspace.querySelector(`#${button.dataset.copyCode}`)?.textContent||'',button);return true;}
    if(button.dataset.copyFormula){const f=formulas.items.find(x=>x.id===button.dataset.copyFormula);if(f)copyText(f.text,button);return true;}
    if(button.dataset.downloadFormula){const f=formulas.items.find(x=>x.id===button.dataset.downloadFormula);if(f)downloadText(f.text,f.filename);return true;}
    if(button.dataset.export){
      beforeExport();const data=buildExport(course);const name=`Expediente_San_Carlos_${new Date().toISOString().slice(0,10)}`;
      if(button.dataset.export==='json')downloadText(JSON.stringify(data,null,2)+'\n',name+'.json','application/json;charset=utf-8');
      else downloadText(exportText(data,course),name+'.txt');
      return true;
    }
    if(button.dataset.pwFigure){
      const figure=course.practices.flatMap(p=>p.figures).find(f=>f.file===button.dataset.pwFigure);
      const dialog=workspace.querySelector('.pw-image-dialog');
      if(figure&&dialog){
        dialog.querySelector('h2').textContent=figure.title;dialog.querySelector('p').textContent=figure.caption;
        dialog.querySelector('img').src=figure.src;dialog.querySelector('img').alt=figure.title+'. '+figure.caption;
        if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');dialog.querySelector('button').focus();}
      }
      return true;
    }
    if(button.hasAttribute('data-close-image')){const dialog=workspace.querySelector('.pw-image-dialog');if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');return true;}
    return false;
  }
  return {announce,downloadText,click,cleanup(){active=false;clearTimeout(statusTimer);}};
}

function showCheck(workspace,control,result){
  const output=workspace.querySelector(`#pw-check-result-${control.id}`);
  const input=workspace.querySelector(`[data-check-input="${control.id}"]`);
  if(!output||!input)return;
  output.className='pw-check-result';
  if(!result.ok){output.textContent=result.message;output.classList.add('pw-result-error');input.setAttribute('aria-invalid','true');return;}
  input.removeAttribute('aria-invalid');
  if(result.correct){output.classList.add('pw-result-ok');output.textContent=control.tolerance===0?'Coincide con la referencia: intervalo correcto.':`Coincide dentro de la tolerancia. Diferencia absoluta: ${textNumber(result.difference,9)}.`;}
  else{output.classList.add('pw-result-mismatch');output.textContent=`El resultado requiere revisión. ${control.hint}`;}
}

function populateFields(workspace,state,practice){
  workspace.querySelectorAll('[data-state-group]').forEach(field=>{
    const group=field.dataset.stateGroup;
    if(group==='note')field.value=state.note;
    else field.value=state[group]?.[field.dataset.stateField]||'';
  });
  workspace.querySelectorAll('[data-task-note]').forEach(field=>{field.value=state.taskNotes[field.dataset.taskNote]||'';});
  for(const control of practice.checks){
    const input=workspace.querySelector(`[data-check-input="${control.id}"]`);const saved=state.checks[control.id];
    if(input&&saved){input.value=saved.raw;if(saved.checked)showCheck(workspace,control,evaluatePracticeNumber(saved.raw,control));}
  }
}

function calculateS06(workspace,state,save){
  const east=parsePracticeNumber(state.s06.e_consulta),north=parsePracticeNumber(state.s06.n_consulta);
  const output=workspace.querySelector('.pw-coordinate-result');
  if(!east.ok||!north.ok){output.textContent='Complete E y N como números antes de calcular.';return;}
  const ec=20*Math.floor(east.value/20)+10,nc=20*Math.floor(north.value/20)+10;
  if(ec<405500||ec>=482400||nc<1132820||nc>=1215920){output.textContent='La coordenada queda fuera de la cuadrícula entregada. Compruebe EPSG:8908 y el orden E / N.';return;}
  state.s06.e_centro=String(ec);state.s06.n_centro=String(nc);state.s06.fila=String(Math.floor((1215920-nc)/20));state.s06.columna=String(Math.floor((ec-405500)/20));
  workspace.querySelector('[data-state-field="e_centro"]').value=String(ec);workspace.querySelector('[data-state-field="n_centro"]').value=String(nc);
  output.textContent=`Centro: E ${ec} m / N ${nc} m. Fila ${state.s06.fila}, columna ${state.s06.columna} (índices desde 0). Confirme distrito y calidad en QGIS.`;
  save();
}

export function bindPractice(root,course,solutions,formulas,practiceId){
  const workspace=root.matches?.('.practice-workspace')?root:root.querySelector('.practice-workspace');
  const practice=course.practices.find(p=>p.id===practiceId);
  if(!workspace||!practice)return()=>{};
  const state=stateForPractice(practice);const tasks=practice.workflow.tasks;
  let timer=null,dirty=false;const listeners=[];
  const on=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
  function updateSavedStatus(){
    const field=workspace.querySelector('.pw-storage-status');if(!field)return;
    const problem=memoryProblems.get(practiceId);
    field.textContent=problem||`Guardado en este navegador${state.updatedAt?' · '+new Date(state.updatedAt).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'}):''}.`;
    field.classList.toggle('pw-storage-warning',Boolean(problem));
  }
  function saveNow(){clearTimeout(timer);timer=null;dirty=false;state.reviewed=state.completedTasks.length===tasks.length;persistState(practiceId,state);updateSavedStatus();}
  function saveSoon(){dirty=true;clearTimeout(timer);timer=setTimeout(saveNow,250);}
  const utilities=createUtility(workspace,course,formulas,()=>{if(dirty)saveNow();});
  function redraw(focus=true){
    workspace.querySelector('.pw-task-content').innerHTML=taskHTML(course,practice,solutions,formulas,state);
    workspace.querySelector('.pw-task-list').innerHTML=taskListHTML(practice,state);
    workspace.querySelector('.pw-count-text').textContent=`${state.completedTasks.length} / ${tasks.length}`;
    workspace.querySelector('.pw-route .pw-progress').value=state.completedTasks.length;
    workspace.querySelector('.pw-practice-complete').hidden=!state.reviewed;
    populateFields(workspace,state,practice);updateSavedStatus();
    if(focus){const title=workspace.querySelector('#pw-active-title');title.focus({preventScroll:true});workspace.querySelector('.pw-task-content').scrollIntoView?.({behavior:'smooth',block:'start'});}
  }
  function go(id){
    if(!tasks.some(t=>t.id===id))return;
    if(dirty)saveNow();state.activeTask=id;saveNow();redraw();
  }
  if(!state.startedAt){state.startedAt=new Date().toISOString();saveNow();}
  populateFields(workspace,state,practice);updateSavedStatus();
  on(workspace,'click',event=>{
    const button=event.target.closest('button');if(!button||!workspace.contains(button))return;
    if(utilities.click(button))return;
    const index=tasks.findIndex(t=>t.id===state.activeTask);
    if(button.dataset.taskGo)go(button.dataset.taskGo);
    else if(button.hasAttribute('data-task-previous')&&index>0)go(tasks[index-1].id);
    else if(button.hasAttribute('data-task-next')&&index<tasks.length-1)go(tasks[index+1].id);
    else if(button.hasAttribute('data-task-pending')){const pending=tasks.find(t=>!state.completedTasks.includes(t.id));if(pending)go(pending.id);}
    else if(button.hasAttribute('data-task-complete')){
      if(!state.completedTasks.includes(state.activeTask))state.completedTasks.push(state.activeTask);
      state.reviewed=state.completedTasks.length===tasks.length;
      if(index<tasks.length-1)state.activeTask=tasks[index+1].id;
      saveNow();redraw();
      if(state.reviewed)utilities.announce(`${practiceId}: todas las tareas están marcadas como revisadas.`);
    }else if(button.hasAttribute('data-task-unreview')){
      state.completedTasks=state.completedTasks.filter(id=>id!==state.activeTask);state.reviewed=false;saveNow();redraw(false);
    }else if(button.hasAttribute('data-s06-center'))calculateS06(workspace,state,saveNow);
    else if(button.hasAttribute('data-s06-csv')){
      const e=parsePracticeNumber(state.s06.e_centro),n=parsePracticeNumber(state.s06.n_centro);
      if(!e.ok||!n.ok||e.value<405500||e.value>=482400||n.value<1132820||n.value>=1215920||e.value%20!==10||n.value%20!==10){utilities.announce('Calcule primero un centro de celda válido para descargar S06.');return;}
      utilities.downloadText(`id_sitio,x_8908,y_8908\nS06,${e.value},${n.value}\n`,'S06_centro_EPSG8908.csv','text/csv;charset=utf-8');
    }
  });
  on(workspace,'change',event=>{
    if(event.target.matches('[data-formula-select]')){
      const task=tasks.find(t=>t.id===state.activeTask);
      workspace.querySelector('.pw-formula-slot').innerHTML=formulaHTML(formulas,task,event.target.value);
    }
  });
  on(workspace,'input',event=>{
    const field=event.target;
    if(field.dataset.taskNote){state.taskNotes[field.dataset.taskNote]=field.value;saveSoon();return;}
    if(field.dataset.checkInput){
      state.checks[field.dataset.checkInput]={raw:field.value,checked:false};
      const output=workspace.querySelector(`#pw-check-result-${field.dataset.checkInput}`);output.textContent='';output.className='pw-check-result';field.removeAttribute('aria-invalid');saveSoon();return;
    }
    if(field.dataset.stateGroup){
      const group=field.dataset.stateGroup;
      if(group==='note')state.note=field.value;
      else if(['s06','report'].includes(group)){
        state[group][field.dataset.stateField]=field.value;
        if(group==='s06'&&['e_consulta','n_consulta'].includes(field.dataset.stateField)){
          for(const key of ['e_centro','n_centro','fila','columna'])state.s06[key]='';
          workspace.querySelector('[data-state-field="e_centro"]').value='';workspace.querySelector('[data-state-field="n_centro"]').value='';
          workspace.querySelector('.pw-coordinate-result').textContent='Coordenadas modificadas: vuelva a calcular el centro.';
        }
      }
      saveSoon();
    }
  });
  on(workspace,'submit',event=>{
    const form=event.target.closest('[data-pw-check]');if(!form)return;event.preventDefault();
    const control=practice.checks.find(c=>c.id===form.dataset.pwCheck);const raw=form.querySelector('input').value;
    state.checks[control.id]={raw,checked:true};showCheck(workspace,control,evaluatePracticeNumber(raw,control));saveNow();
  });
  on(workspace,'keydown',event=>{
    const link=event.target.closest('[data-task-go]');
    if(link&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const list=[...workspace.querySelectorAll('[data-task-go]')];const index=list.indexOf(link);
      const target=event.key==='Home'?0:event.key==='End'?list.length-1:(index+(event.key==='ArrowDown'?1:-1)+list.length)%list.length;
      list[target].focus();
    }
    if(event.key==='Escape'){const dialog=workspace.querySelector('.pw-image-dialog');if(dialog?.hasAttribute('open')&&typeof dialog.close!=='function')dialog.removeAttribute('open');}
  });
  const windowTarget=globalThis.window||globalThis;
  if(windowTarget.addEventListener)on(windowTarget,'pagehide',()=>{if(dirty)saveNow();});
  return()=>{if(dirty)saveNow();listeners.forEach(remove=>remove());clearTimeout(timer);utilities.cleanup();};
}

function prepareImport(data,course){
  const fail=message=>{throw new Error(message);};
  if(!data||typeof data!=='object'||Array.isArray(data))fail('El archivo debe contener un expediente JSON.');
  if(!['san-carlos-expediente/1.0','san-carlos-expediente/2.0'].includes(data.schemaVersion))fail('El archivo no utiliza un formato de expediente reconocido por este taller.');
  if(![course.title,...(course.legacyTitles||[])].includes(data.workshop))fail('El archivo corresponde a otro taller o no identifica este expediente.');
  if(!Array.isArray(data.practices)||data.practices.length<1||data.practices.length>course.practices.length)fail('El expediente debe contener entre una y seis prácticas.');
  const seen=new Set();
  const reportKeys=REPORT_FIELDS.map(([key])=>key);
  const s06Keys=['distrito','criterio','e_consulta','n_consulta','e_centro','n_centro','fila','columna','ndvi_decision','savi_decision','mndwi_decision','comparacion','observacion','interpretacion','comprobacion',...['f1','f2'].flatMap(comp=>S06_OBSERVATIONS.map(([key])=>`${comp}_${key}`))];
  const text=(value,label)=>{
    if(value===undefined||value===null)return '';
    if(typeof value!=='string'||value.length>200000)fail(`${label}: se esperaba texto de hasta 200.000 caracteres.`);
    return value;
  };
  const fields=(value,allowed,label)=>{
    if(value===undefined||value===null)return {};
    if(typeof value!=='object'||Array.isArray(value))fail(`${label}: los campos tienen un formato incorrecto.`);
    const result={};
    for(const [key,valueText]of Object.entries(value)){
      if(!allowed.includes(key))fail(`${label}: el campo «${key}» no forma parte de este expediente.`);
      result[key]=text(valueText,`${label} · ${key}`);
    }
    return result;
  };
  return data.practices.map(entry=>{
    if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('Se encontró una práctica con formato incorrecto.');
    const practice=course.practices.find(p=>p.id===entry.id);
    if(!practice||seen.has(entry.id))fail('Los códigos de práctica deben ser válidos y no pueden repetirse.');
    seen.add(entry.id);
    const state=emptyState();state.note=text(entry.note,entry.id+' · nota');
    state.report=fields(entry.report,reportKeys,entry.id+' · informe');state.s06=fields(entry.s06,s06Keys,entry.id+' · S06');
    if(entry.checks!==undefined&&!Array.isArray(entry.checks))fail(entry.id+': los controles deben ser una lista.');
    const checkSeen=new Set();
    for(const check of entry.checks||[]){
      if(!check||typeof check!=='object'||!practice.checks.some(c=>c.id===check.id)||checkSeen.has(check.id))fail(entry.id+': hay controles desconocidos o repetidos.');
      if(check.checked!==undefined&&typeof check.checked!=='boolean')fail(entry.id+': el estado de un control no es válido.');
      checkSeen.add(check.id);state.checks[check.id]={raw:text(check.response,entry.id+' · respuesta'),checked:check.checked===true};
    }
    if(entry.reviewedByParticipant!==undefined&&typeof entry.reviewedByParticipant!=='boolean')fail(entry.id+': el estado de revisión no es válido.');
    const taskIds=practice.workflow.tasks.map(t=>t.id);
    state.taskNotes=fields(entry.taskNotes,taskIds,entry.id+' · notas de tareas');
    if(data.schemaVersion==='san-carlos-expediente/1.0'){
      state.completedTasks=entry.reviewedByParticipant===true?[...taskIds]:[];
    }else{
      if(entry.completedTasks!==undefined&&(!Array.isArray(entry.completedTasks)||entry.completedTasks.some(id=>!taskIds.includes(id))))fail(entry.id+': hay tareas desconocidas en el avance.');
      state.completedTasks=[...new Set(entry.completedTasks||[])];
      if(entry.activeTask!==undefined&&entry.activeTask!==null&&!taskIds.includes(entry.activeTask))fail(entry.id+': la tarea activa no forma parte del recorrido.');
      state.activeTask=entry.activeTask||null;
    }
    state.activeTask=state.activeTask||taskIds.find(id=>!state.completedTasks.includes(id))||taskIds[0];
    state.reviewed=state.completedTasks.length===taskIds.length;
    for(const key of ['startedAt','updatedAt'])state[key]=typeof entry[key]==='string'&&Number.isFinite(Date.parse(entry[key]))?entry[key]:null;
    if(data.schemaVersion==='san-carlos-expediente/1.0'&&!state.startedAt&&state.updatedAt)state.startedAt=state.updatedAt;
    return {practice,state};
  });
}

function importPreviewHTML(pending){
  return `<h2 id="pw-import-preview-title">Revise el expediente antes de restaurarlo</h2><p>Archivo: <strong>${escapeHTML(pending.filename)}</strong>. Se reemplazarán únicamente los registros de las ${pending.entries.length} prácticas indicadas. Las demás se conservarán.</p><div class="pw-import-table"><table><thead><tr><th scope="col">Práctica</th><th scope="col">En este navegador</th><th scope="col">En el archivo</th></tr></thead><tbody>${pending.entries.map(({practice,state})=>{
    const current=stateForPractice(practice);
    const incomingNotes=(state.note?1:0)+Object.values(state.taskNotes).filter(Boolean).length;
    const currentNotes=(current.note?1:0)+Object.values(current.taskNotes).filter(Boolean).length;
    return `<tr><th scope="row">${practice.id} · ${escapeHTML(practice.title)}</th><td>${current.completedTasks.length} tareas revisadas<br>${currentNotes} notas</td><td>${state.completedTasks.length} tareas revisadas<br>${incomingNotes} notas${state.note?`<p class="pw-import-excerpt">${escapeHTML(state.note.slice(0,160))}${state.note.length>160?'…':''}</p>`:''}${practice.id==='P06'?`<p>${REPORT_FIELDS.filter(([key])=>state.report[key]).length} apartados del informe con texto</p>`:''}</td></tr>`;
  }).join('')}</tbody></table></div><p class="pw-help">Puede exportar una copia de los registros actuales antes de reemplazarlos.</p><div class="pw-import-actions"><button type="button" class="pw-button pw-button-secondary" data-export="json">Guardar copia actual</button><button type="button" class="pw-button" data-import-confirm>Reemplazar ${pending.entries.length} ${pending.entries.length===1?'registro':'registros'}</button><button type="button" class="pw-text-button" data-import-cancel>Cancelar</button></div>`;
}

export function bindPortfolio(root,course,solutions,formulas){
  const workspace=root.matches?.('.pw-portfolio')?root:root.querySelector('.pw-portfolio');
  if(!workspace)return()=>{};
  const utilities=createUtility(workspace,course,formulas);let pending=null,active=true,sequence=0;
  const listeners=[];const on=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
  const importStatus=workspace.querySelector('.pw-import-status');
  const preview=workspace.querySelector('.pw-import-preview');
  function refresh(){
    workspace.querySelector('.pw-portfolio-items').innerHTML=portfolioItemsHTML(course);
    const progress=getWorkshopProgress(course);
    workspace.querySelector('.pw-portfolio-reviewed').textContent=`${progress.reviewedCount} / ${progress.total}`;
    workspace.querySelector('.pw-portfolio-started').textContent=String(progress.startedCount);
    const resume=workspace.querySelector('.pw-portfolio-summary>a');
    resume.href=progress.nextPracticeId?'#/practicas/'+progress.nextPracticeId:'#/practicas/P06';
    resume.textContent=progress.nextPracticeId?'Continuar mi trabajo →':'Revisar la entrega →';
    const problems=course.practices.some(p=>memoryProblems.get(p.id));
    const info=workspace.querySelector('.pw-portfolio-storage');
    info.textContent=problems?'El navegador no permite conservar parte del registro de forma persistente. Exporte una copia antes de cerrar la pestaña.':'El registro se guarda en este navegador. La exportación permite conservar una copia fuera de este equipo.';
    info.classList.toggle('pw-storage-warning',problems);
  }
  refresh();
  on(workspace,'change',async event=>{
    if(!event.target.matches('[data-import-file]'))return;
    const file=event.target.files?.[0];pending=null;preview.hidden=true;preview.innerHTML='';
    const turn=++sequence;
    if(!file){importStatus.textContent='';return;}
    if(file.size>2000000){importStatus.textContent='El archivo supera 2 MB. Seleccione un expediente JSON exportado desde este taller.';return;}
    importStatus.textContent='Revisando estructura y registros del archivo…';
    try{
      const data=JSON.parse(await file.text());
      if(!active||turn!==sequence)return;
      const entries=prepareImport(data,course);
      pending={filename:file.name,entries};
      preview.innerHTML=importPreviewHTML(pending);preview.hidden=false;
      importStatus.textContent='Archivo válido. Revise la comparación y confirme para reemplazar los registros.';
      preview.scrollIntoView?.({behavior:'smooth',block:'start'});
    }catch(error){if(active&&turn===sequence)importStatus.textContent=error instanceof SyntaxError?'El archivo no contiene JSON válido. No se modificó su expediente.':`${error.message} No se modificó su expediente.`;}
  });
  on(workspace,'click',event=>{
    const button=event.target.closest('button');if(!button||!workspace.contains(button))return;
    if(utilities.click(button))return;
    if(button.hasAttribute('data-import-cancel')){
      pending=null;sequence++;preview.hidden=true;preview.innerHTML='';workspace.querySelector('[data-import-file]').value='';importStatus.textContent='Restauración cancelada. Su expediente se conserva.';
    }else if(button.hasAttribute('data-import-confirm')&&pending){
      let failures=0;const count=pending.entries.length;
      for(const {practice,state}of pending.entries){memory.set(practice.id,state);if(persistState(practice.id,state))failures++;}
      pending=null;preview.hidden=true;preview.innerHTML='';workspace.querySelector('[data-import-file]').value='';refresh();
      importStatus.textContent=failures?`Se restauraron ${count} registros en esta pestaña. El navegador no permite guardarlos de forma persistente; exporte una copia antes de salir.`:`Se restauraron ${count} registros. Puede reanudar las prácticas desde el punto guardado.`;
      utilities.announce(failures?'Expediente restaurado temporalmente. Exporte una copia.':'Expediente restaurado.');
    }
  });
  return()=>{active=false;sequence++;listeners.forEach(remove=>remove());utilities.cleanup();};
}
