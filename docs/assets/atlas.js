/* Atlas del taller San Carlos. Consulta los resultados cerrados del ejercicio.
 * La interacción cambia la vista; no recalcula índices ni estadísticas ráster.
 */
const STORAGE_KEY = 'san-carlos-taller:atlas:v2';
const VIEWS = [['districts','Distritos'],['table','Tabla'],['support','Soporte observado'],['thresholds','Umbrales MNDWI'],['dates','Fechas']];
const METRICS = {coverage: 'Cobertura comparable de NDVI', delta: 'Diferencia media de NDVI'};
let memoryState;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (value, decimals = 2) => value == null || !Number.isFinite(Number(value)) ? 'Sin dato' : new Intl.NumberFormat('es-CR', {minimumFractionDigits:decimals, maximumFractionDigits:decimals}).format(value);
const signed = value => value == null ? 'Sin dato' : `${value >= 0 ? '+' : ''}${number(value,6)}`;
const date = value => {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [year,month,day] = String(value).split('-');
  return `${Number(day)} ${months[Number(month)-1]} ${year}`;
};
const imagePath = value => /^assets\/media\/[A-Za-z0-9_.-]+\.webp$/.test(value || '') ? value : '';
const siteRows = sites => Array.isArray(sites) ? sites : (sites?.sites || []);

function loadState(territory, stats, sites) {
  let stored = memoryState;
  if (!stored) { try { stored = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || 'null'); } catch { stored = null; } }
  const state = {view:'districts', selected:'canton', metric:'coverage', order:'code', query:'', threshold:.1, pair:4, site:'S02', ...stored};
  if (!VIEWS.some(([id]) => id === state.view)) state.view = 'districts';
  if (state.selected !== 'canton' && !territory.districts.some(d => d.id === state.selected)) state.selected = 'canton';
  if (!(state.metric in METRICS)) state.metric = 'coverage';
  if (!['code','coverage','delta'].includes(state.order)) state.order = 'code';
  state.query = String(state.query || '').slice(0,80);
  if (!stats.thresholds.some(t => t.threshold === state.threshold)) state.threshold = .1;
  if (!Number.isInteger(state.pair) || !stats.datePairs[state.pair]) state.pair = 0;
  if (!siteRows(sites).some(s => (s.id || s.id_sitio) === state.site)) state.site = siteRows(sites)[0]?.id || siteRows(sites)[0]?.id_sitio || '';
  return state;
}

function saveState(state) {
  memoryState = {...state};
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* La selección permanece en memoria durante la visita. */ }
}

function summary(territory, stats, id) {
  if (id !== 'canton') return territory.districts.find(d => d.id === id);
  return {id:'canton', name:'Todo San Carlos', code:210, areaHa:stats.coverage.gridHa,
    commonHa:stats.coverage.commonHa, commonCells:stats.coverage.commonCells,
    coveragePct:stats.coverage.coveragePct,
    meanF1:stats.canton.f1_ndvi_common.mean, meanF2:stats.canton.f2_ndvi_common.mean,
    delta:stats.aggregation.weightedMean};
}

function reportText(d, territory) {
  return `${d.id === 'canton' ? 'En el cantón San Carlos' : `En el distrito ${d.name} (${d.code})`}, ${number(d.commonHa)} ha tienen NDVI válido en ambas composiciones: ${number(d.coveragePct)} % de las ${number(d.areaHa)} ha de la cuadrícula ${d.id === 'canton' ? 'cantonal' : 'distrital'}. La media de NDVI es ${number(d.meanF1,6)} en F1 y ${number(d.meanF2,6)} en F2; la diferencia media F2 − F1 es ${signed(d.delta)}. Las composiciones reúnen adquisiciones de 2025, cuya fecha se conserva por celda. El resultado describe la superficie comparable. Límites IGN / Registro Nacional, publicados mediante SNIT; versión ${territory.officialVersion}, EPSG:8908.`;
}

function credit(territory) {
  return `<div class="at-credit"><span>IGN / Registro Nacional / SNIT · versión ${escapeHTML(territory.officialVersion)} · EPSG:8908</span><a href="${escapeHTML(territory.sourceUrl)}" target="_blank" rel="noopener">Servicio oficial ↗</a><a href="#/fuentes">Fuentes y método</a></div>`;
}

function figure(src, caption) {
  const safe = imagePath(src);
  return `<figure class="at-figure"><button class="at-figure-button" data-at-figure="${escapeHTML(safe)}" data-at-caption="${escapeHTML(caption)}" aria-label="Ampliar: ${escapeHTML(caption)}"><img src="${escapeHTML(safe)}" alt="${escapeHTML(caption)}" loading="lazy"><span>Ampliar lámina ↗</span></button><figcaption>${escapeHTML(caption)}</figcaption></figure>`;
}

function inspector(d) {
  const isCanton = d.id === 'canton';
  return `<p class="at-kicker">${isCanton ? 'Resultado cantonal' : `Distrito ${d.code}`}</p>
    <h2 id="at-inspector-title" tabindex="-1">${escapeHTML(d.name)}</h2>
    <div class="at-primary-result"><span>Cobertura comparable</span><strong>${number(d.coveragePct)} <small>%</small></strong><div class="at-coverage-track" role="img" aria-label="${number(d.coveragePct)} por ciento comparable"><span style="width:${d.coveragePct == null ? 0 : d.coveragePct}%"></span></div><p>${number(d.commonHa)} ha de ${number(d.areaHa)} ha de cuadrícula</p></div>
    <dl class="at-inspector-values"><div><dt>Diferencia media F2 − F1</dt><dd>${signed(d.delta)}</dd></div><div><dt>NDVI medio de F1</dt><dd>${number(d.meanF1,6)}</dd></div><div><dt>NDVI medio de F2</dt><dd>${number(d.meanF2,6)}</dd></div><div><dt>Celdas comparables</dt><dd>${number(d.commonCells,0)}</dd></div>${!isCanton ? `<div><dt>Peso en el soporte cantonal</dt><dd>${number(d.commonWeightPct)} %</dd></div>` : ''}</dl>
    <p class="at-interpretation">${!isCanton && d.coveragePct < 40 ? 'Menos del 40 % de este distrito admite comparación. Puedes elegir aquí S06 y documentar esa limitación.' : 'Las medias utilizan las mismas celdas en F1 y F2. La superficie excluida queda fuera del resultado.'}</p>
    <button class="at-button at-primary" data-at-copy-report>Copiar resultado para el informe</button>
    <div class="at-inspector-links"><a href="#/practicas/P05">Abrir práctica P05 →</a>${!isCanton && d.coveragePct < 40 ? '<a href="#/practicas/P06">Documentar S06 →</a>' : ''}</div>`;
}

function tableRows(territory, state) {
  const query = state.query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const list = territory.districts.filter(d => `${d.code} ${d.name}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
  list.sort((a,b) => state.order === 'coverage' ? a.coveragePct-b.coveragePct : state.order === 'delta' ? b.delta-a.delta : a.code-b.code);
  if (!list.length) return '<tr><td colspan="6" class="at-empty">No hay un distrito con ese nombre o código. Borra la búsqueda para ver los trece.</td></tr>';
  return list.map(d => `<tr class="${state.selected === d.id ? 'is-selected' : ''}"><th scope="row"><button class="at-table-select" data-row-district="${d.id}" aria-label="Abrir resultado de ${escapeHTML(d.name)}"><span>${d.code}</span>${escapeHTML(d.name)} <b aria-hidden="true">↗</b></button></th><td class="at-numeric">${number(d.commonHa)}</td><td class="at-numeric">${number(d.coveragePct)} %</td><td class="at-numeric">${number(d.meanF1,6)}</td><td class="at-numeric">${number(d.meanF2,6)}</td><td class="at-numeric at-delta-cell">${signed(d.delta)}</td></tr>`).join('');
}

function thresholdResult(v) {
  return `<div class="at-threshold-primary"><p>MNDWI &gt; ${number(v.threshold,1)} únicamente en F2</p><strong>${number(v.onlyF2Ha)} <small>ha</small></strong><span>Sobre ${number(v.commonHa)} ha comparables en ambas composiciones</span></div><dl class="at-threshold-values"><div><dt>Superan en ambas</dt><dd>${number(v.bothHa)} ha</dd></div><div><dt>Superan sólo en F1</dt><dd>${number(v.onlyF1Ha)} ha</dd></div><div><dt>No superan en ninguna</dt><dd>${number(v.neitherHa)} ha</dd></div></dl><button class="at-button at-primary" data-at-copy-threshold>Copiar el resultado del umbral</button>`;
}

function dateResult(pair) {
  return `<p class="at-kicker">Pareja seleccionada</p><h3>${date(pair.f1)} → ${date(pair.f2)}</h3><dl class="at-date-values"><div><dt>Superficie</dt><dd>${number(pair.areaHa)} ha</dd></div><div><dt>Parte del soporte común</dt><dd>${number(pair.sharePct)} %</dd></div><div><dt>Intervalo</dt><dd>${pair.days} días</dd></div><div><dt>Celdas</dt><dd>${number(pair.cells,0)}</dd></div></dl><button class="at-button at-primary" data-at-copy-dates>Copiar pareja de fechas</button>`;
}

function siteResult(site) {
  if (!site) return '';
  const a = site.observaciones.f1, b = site.observaciones.f2;
  const practice = {S01:'P03', S02:'P02', S03:'P04', S04:'P04', S05:'P06'}[site.id || site.id_sitio] || 'P03';
  return `<div class="at-site-heading"><div><p class="at-kicker">${escapeHTML(site.id || site.id_sitio)} · ${escapeHTML(site.name || site.distrito)}</p><h3>${escapeHTML(site.objetivo)}</h3></div><a class="at-button" href="#/practicas/${practice}">Abrir práctica →</a></div><div class="at-site-readings"><div><strong>F1 · ${date(a.fecha)}</strong><span>SCL ${a.scl} · margen seguro ${a.margen_seguro}</span><span>NDVI: <b>${number(a.indices.ndvi,6)}</b></span></div><div><strong>F2 · ${date(b.fecha)}</strong><span>SCL ${b.scl} · margen seguro ${b.margen_seguro}</span><span>NDVI: <b>${number(b.indices.ndvi,6)}</b></span></div><div><strong>Diferencia F2 − F1</strong><span class="at-site-delta">${signed(site.comparacion.delta_ndvi)}</span><span>Centro E ${number(site.x_8908,0)} / N ${number(site.y_8908,0)} m</span></div></div>${figure(site.image, `${site.id || site.id_sitio}, ${site.name || site.distrito}: contexto y lectura de la celda de control.`)}<p class="at-note">${escapeHTML(site.respuesta)}</p>`;
}

export function renderAtlas(territory, stats, sites) {
  const state = loadState(territory,stats,sites);
  const d = summary(territory,stats,state.selected);
  const controls = siteRows(sites);
  const threshold = stats.thresholds.find(v => v.threshold === state.threshold);
  return `<section class="at-workspace" aria-label="Atlas de trabajo de San Carlos">
    <header class="at-header"><div><p class="at-kicker">Atlas de trabajo · San Carlos</p><h1>Consultar y documentar resultados</h1><p>Selecciona el territorio, comprueba la cobertura y lleva el resultado a tu informe.</p></div><a class="at-button" href="#/practicas/P05">Trabajar en P05 →</a></header>
    <dl class="at-overview" aria-label="Referencia cantonal"><div><dt>Cuadrícula cantonal</dt><dd>${number(stats.coverage.gridHa)} <small>ha</small></dd></div><div><dt>Superficie comparable NDVI</dt><dd>${number(stats.coverage.commonHa)} <small>ha</small></dd></div><div><dt>Cobertura cantonal</dt><dd>${number(stats.coverage.coveragePct)} <small>%</small></dd></div><div><dt>Diferencia media cantonal</dt><dd>${signed(stats.aggregation.weightedMean)}</dd></div></dl>
    <nav class="at-tabs" role="tablist" aria-label="Vistas del atlas">${VIEWS.map(([id,label]) => `<button id="at-tab-${id}" role="tab" aria-selected="${state.view === id}" aria-controls="at-panel-${id}" tabindex="${state.view === id ? 0 : -1}" data-at-view="${id}">${label}</button>`).join('')}</nav>
    <div class="at-announcement" role="status" aria-live="polite"></div>
    <section id="at-panel-districts" class="at-tabpanel" role="tabpanel" aria-labelledby="at-tab-districts" ${state.view === 'districts' ? '' : 'hidden'}>
      <div class="at-toolbar"><label>Variable del mapa<select id="map-variable"><option value="coverage" ${state.metric === 'coverage' ? 'selected' : ''}>Cobertura comparable (%)</option><option value="delta" ${state.metric === 'delta' ? 'selected' : ''}>Diferencia media NDVI</option></select></label><label>Territorio<select id="district-select"><option value="canton">Todo San Carlos</option>${territory.districts.map(v => `<option value="${v.id}" ${state.selected === v.id ? 'selected' : ''}>${v.code} · ${escapeHTML(v.name)}</option>`).join('')}</select></label><button class="at-button" data-at-reset>Ver todo el cantón</button></div>
      <div class="at-map-layout"><div class="at-map-card"><div class="at-map-top"><div><h2 id="at-map-title">${METRICS[state.metric]}</h2><p>Resumen por distrito; el color no ubica las celdas válidas.</p></div><button class="at-text-button" data-at-open-view="support">Ver soporte observado →</button></div>
        <div class="at-map-controls" aria-label="Encuadre cartográfico"><button class="at-icon-button" data-at-zoom="in" aria-label="Acercar mapa">+</button><button class="at-icon-button" data-at-zoom="out" aria-label="Alejar mapa">−</button><button class="at-button" data-at-fit ${state.selected === 'canton' ? 'disabled' : ''}>Enfocar distrito</button><span id="at-zoom-label">Vista cantonal</span></div>
        <div class="at-map-stage"><svg id="district-map" viewBox="${territory.viewBox}" role="group" aria-label="Mapa de los trece distritos de San Carlos" aria-describedby="at-map-help"></svg><div class="at-north" aria-hidden="true">N ↑</div></div>
        <p id="at-map-help" class="at-map-help">Pulsa un distrito o elígelo en Territorio. Con teclado: Tab para recorrer; Enter para seleccionar.</p>
        <div id="map-legend" class="at-legend"></div>${credit(territory)}
      </div><aside id="district-detail" class="at-inspector" aria-labelledby="at-inspector-title">${inspector(d)}</aside></div>
    </section>
    <section id="at-panel-table" class="at-tabpanel" role="tabpanel" aria-labelledby="at-tab-table" ${state.view === 'table' ? '' : 'hidden'}>
      <div class="at-section-header"><div><h2>Tabla de los trece distritos</h2><p>Selecciona un nombre para abrir su resultado. El CSV conserva todas las filas y su precisión original.</p></div><button class="at-button at-primary" id="export-districts">Descargar tabla CSV</button></div>
      <div class="at-table-controls"><label>Buscar distrito<input id="at-district-search" type="search" value="${escapeHTML(state.query)}" placeholder="Nombre o código" autocomplete="off"></label><label>Ordenar<select id="table-order"><option value="code" ${state.order === 'code' ? 'selected' : ''}>Código de distrito</option><option value="coverage" ${state.order === 'coverage' ? 'selected' : ''}>Menor cobertura primero</option><option value="delta" ${state.order === 'delta' ? 'selected' : ''}>Mayor diferencia primero</option></select></label></div>
      <div class="at-table-scroll" tabindex="0" aria-label="Tabla distrital; desplaza horizontalmente para ver todas las columnas"><table><caption>NDVI válido en ambas composiciones. Superficies en hectáreas; índices adimensionales.</caption><thead><tr><th scope="col">Distrito</th><th scope="col" class="at-numeric">Comparable, ha</th><th scope="col" class="at-numeric">Cobertura</th><th scope="col" class="at-numeric">NDVI F1</th><th scope="col" class="at-numeric">NDVI F2</th><th scope="col" class="at-numeric">F2 − F1</th></tr></thead><tbody id="district-rows">${tableRows(territory,state)}</tbody></table></div>
      <div class="at-aggregation"><div><span>Promedio de trece medias distritales</span><strong>${signed(stats.aggregation.simpleMean)}</strong></div><div><span>Media ponderada por celdas comparables</span><strong>${signed(stats.aggregation.weightedMean)}</strong></div><p>${escapeHTML(stats.aggregation.interpretation)}</p></div>
    </section>
    <section id="at-panel-support" class="at-tabpanel" role="tabpanel" aria-labelledby="at-tab-support" ${state.view === 'support' ? '' : 'hidden'}>
      <div class="at-section-header"><div><h2>Dónde existe observación comparable</h2><p>Esta lámina muestra la distribución del soporte común. La geometría distrital permanece igual en F1 y F2.</p></div><a class="at-button" href="#/practicas/P04">Trabajar en P04 →</a></div>
      <div class="at-support-metrics"><span><b>${number(stats.coverage.commonHa)} ha</b> comparables</span><span><b>${number(stats.coverage.excludedHa)} ha</b> sin soporte común</span><span><b>NoData</b> conserva la ausencia de observación</span></div>
      ${figure('assets/media/03_soporte_comun.webp','Soporte común de NDVI en los trece distritos: celdas válidas en ambas composiciones y celdas excluidas.')}
      <div class="at-site-section"><div class="at-section-header"><div><h2>Inspeccionar una celda resuelta</h2><p>Los cinco sitios son controles didácticos; no constituyen una muestra estadística.</p></div><label>Sitio<select id="at-site-select">${controls.map(s => `<option value="${escapeHTML(s.id || s.id_sitio)}" ${(s.id || s.id_sitio) === state.site ? 'selected' : ''}>${escapeHTML(s.id || s.id_sitio)} · ${escapeHTML(s.name || s.distrito)}</option>`).join('')}</select></label></div><div id="at-site-result">${siteResult(controls.find(s => (s.id || s.id_sitio) === state.site))}</div></div>
    </section>
    <section id="at-panel-thresholds" class="at-tabpanel" role="tabpanel" aria-labelledby="at-tab-thresholds" ${state.view === 'thresholds' ? '' : 'hidden'}>
      <div class="at-section-header"><div><h2>Comprobar el efecto del umbral</h2><p>Las tres reglas usan las mismas ${number(stats.thresholds[0].commonHa)} ha de soporte común MNDWI.</p></div><a class="at-button" href="#/practicas/P04">Trabajar en P04 →</a></div>
      <div class="at-threshold-layout"><section class="at-panel"><h3>Regla de selección</h3><div class="at-threshold-buttons" role="group" aria-label="Umbral estricto de MNDWI">${stats.thresholds.map(v => `<button data-threshold="${v.threshold}" aria-pressed="${state.threshold === v.threshold}">MNDWI &gt; ${number(v.threshold,1)}</button>`).join('')}</div><div id="threshold-result" aria-live="polite">${thresholdResult(threshold)}</div></section><section class="at-panel"><h3>Comparación de las tres reglas</h3><p>Superficie que supera el umbral sólo en F2.</p><div class="at-threshold-chart">${stats.thresholds.map(v => `<button class="at-threshold-bar" data-threshold="${v.threshold}" aria-pressed="${state.threshold === v.threshold}"><span>&gt; ${number(v.threshold,1)}</span><span class="at-bar-track"><span style="width:${v.onlyF2Ha/Math.max(...stats.thresholds.map(t => t.onlyF2Ha))*100}%"></span></span><strong>${number(v.onlyF2Ha)} ha</strong></button>`).join('')}</div><p class="at-note">${escapeHTML(stats.thresholdNote)}</p><button class="at-button" data-at-export-thresholds>Descargar los tres umbrales CSV</button></section></div>
    </section>
    <section id="at-panel-dates" class="at-tabpanel" role="tabpanel" aria-labelledby="at-tab-dates" ${state.view === 'dates' ? '' : 'hidden'}>
      <div class="at-section-header"><div><h2>Documentar las fechas que se comparan</h2><p>Elige una pareja. Su superficie y porcentaje describen las celdas que comparten esas adquisiciones.</p></div><button class="at-button" data-at-export-dates>Descargar fechas CSV</button></div>
      <div class="at-dates-layout"><div class="at-date-grid">${stats.datePairs.map((p,i) => `<button class="at-date-card" data-at-pair="${i}" aria-pressed="${state.pair === i}"><span>F1 · ${date(p.f1)}</span><span>F2 · ${date(p.f2)}</span><strong>${number(p.sharePct)} <small>%</small></strong><span>${number(p.areaHa)} ha · ${p.days} días</span></button>`).join('')}</div><aside id="at-date-result" class="at-panel" aria-live="polite">${dateResult(stats.datePairs[state.pair])}</aside></div><p class="at-note">${escapeHTML(stats.datePairsNote)} El porcentaje usa las ${number(stats.coverage.commonHa)} ha comparables de NDVI.</p><a class="at-inline-link" href="#/practicas/P02">Consultar fecha y procedencia en P02 →</a>
    </section>
    <section class="at-copy-fallback" hidden aria-labelledby="at-copy-title"><h2 id="at-copy-title">Copiar el resultado</h2><p>El navegador no permitió copiar automáticamente. Selecciona el texto y usa Copiar.</p><textarea readonly rows="6" aria-label="Texto preparado para copiar"></textarea><button class="at-button" data-at-select-copy>Seleccionar todo</button><button class="at-text-button" data-at-close-copy>Cerrar</button></section>
    <dialog class="at-image-dialog" aria-labelledby="at-image-title"><div class="at-dialog-header"><h2 id="at-image-title">Lámina de referencia</h2><button class="at-button" data-at-close-image>Cerrar ×</button></div><div class="at-dialog-image-area"><img alt=""></div><p></p></dialog>
    <footer class="at-footer">Resultados del ejercicio con datos de 2025. Las áreas y medias proceden de los archivos completos; el SVG simplifica los límites para consulta. Contiene datos Copernicus Sentinel modificados (2025).<a href="#/materiales">Descargar los datos y proyectos →</a></footer>
  </section>`;
}

function color(d, metric, extent) {
  const value = metric === 'coverage' ? d.coveragePct : d.delta;
  if (value == null || !Number.isFinite(value)) return '#c4cdd4';
  const blend = (a,b,t) => `rgb(${a.map((v,i) => Math.round(v+(b[i]-v)*Math.max(0,Math.min(1,t)))).join(',')})`;
  return metric === 'coverage' ? blend([233,243,243],[8,127,140],value/100) : value < 0 ? blend([243,246,249],[189,90,50],Math.abs(value)/extent) : blend([243,246,249],[8,127,140],value/extent);
}

function csv(rows) {
  return '\ufeff'+rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
}

export function bindAtlas(root, territory, stats, sites) {
  const workspace = root.matches?.('.at-workspace') ? root : root.querySelector('.at-workspace');
  if (!workspace) return () => {};
  const state = loadState(territory,stats,sites);
  const map = workspace.querySelector('#district-map');
  const fullBox = territory.viewBox.split(/\s+/).map(Number);
  let viewBox = [...fullBox], disposed = false, imageTrigger, copyTrigger;
  const listeners = [], urls = new Set(), timers = new Set();
  const on = (element,event,callback) => { element.addEventListener(event,callback); listeners.push(() => element.removeEventListener(event,callback)); };
  const defer = (callback,delay) => { const id=setTimeout(() => {timers.delete(id); callback();},delay); timers.add(id); };
  const announce = message => { if (!disposed) workspace.querySelector('.at-announcement').textContent = message; };
  const scrollTo = element => { element.scrollIntoView?.({block:'start',behavior:'auto'}); };
  const extent = Math.max(...territory.districts.map(d => Math.abs(d.delta ?? 0)),.000001);
  const largeLabels = new Set(['21006','21007','21010','21011','21012','21013']);

  function drawPaths() {
    map.innerHTML = territory.districts.map(d => `<path d="${escapeHTML(d.svgPath)}" fill-rule="evenodd" data-district="${d.id}" tabindex="0" role="button"><title>${escapeHTML(d.name)}</title></path>`).join('')+territory.districts.map(d => `<text x="${d.labelPoint[0]}" y="${d.labelPoint[1]}" text-anchor="middle" class="${largeLabels.has(d.id) ? 'at-label-name' : 'at-label-code'}" aria-hidden="true">${escapeHTML(largeLabels.has(d.id) ? d.name : String(d.code).slice(-2))}</text>`).join('');
    updateMap();
  }

  function updateMap() {
    for (const d of territory.districts) {
      const p = map.querySelector(`[data-district="${d.id}"]`);
      p.setAttribute('fill', color(d,state.metric,extent));
      p.classList.toggle('is-selected', state.selected === d.id);
      p.setAttribute('aria-pressed',String(state.selected === d.id));
      p.setAttribute('aria-label',`${d.code} ${d.name}: ${state.metric === 'coverage' ? number(d.coveragePct)+' % comparable' : signed(d.delta)+' de diferencia media NDVI'}. Abrir resultado.`);
    }
    workspace.querySelector('#at-map-title').textContent = METRICS[state.metric];
    workspace.querySelector('#map-variable').value = state.metric;
    workspace.querySelector('#district-select').value = state.selected;
    workspace.querySelector('[data-at-fit]').disabled = state.selected === 'canton';
    const coverage = state.metric === 'coverage';
    workspace.querySelector('#map-legend').innerHTML = `<div class="at-legend-title">${coverage ? 'Porcentaje de la cuadrícula con NDVI válido en F1 y F2' : 'Media de la diferencia NDVI de las mismas celdas, F2 − F1'}</div><div class="at-legend-scale" style="background:linear-gradient(90deg,${coverage ? '#e9f3f3,#087f8c' : '#bd5a32,#f3f6f9,#087f8c'})"></div><div class="at-legend-ticks">${coverage ? '<span>0 %</span><span>50 %</span><span>100 %</span>' : `<span>${number(-extent,3)}</span><span>0</span><span>+${number(extent,3)}</span>`}</div><div class="at-legend-explanation">${coverage ? 'Más oscuro: mayor proporción comparable. La vista Soporte observado muestra su ubicación.' : 'Cobre: diferencia negativa. Azul: positiva. Los índices son adimensionales.'}</div><p class="at-code-key">Códigos de distritos pequeños: 01 Quesada · 02 Florencia · 03 Buenavista · 04 Aguas Zarcas · 05 Venecia · 08 La Tigra · 09 La Palmera.</p>`;
    for (const option of workspace.querySelectorAll('#district-select option')) {
      const d = territory.districts.find(v => v.id === option.value);
      if (d) option.textContent = `${d.code} · ${d.name} · ${coverage ? number(d.coveragePct)+' %' : signed(d.delta)}`;
    }
  }

  function changeView(id, focus = false) {
    if (!VIEWS.some(([view]) => id === view)) return;
    state.view = id;
    for (const button of workspace.querySelectorAll('[data-at-view]')) {
      const selected = button.dataset.atView === id;
      button.setAttribute('aria-selected',String(selected)); button.tabIndex = selected ? 0 : -1;
    }
    for (const panel of workspace.querySelectorAll('.at-tabpanel')) panel.hidden = panel.id !== `at-panel-${id}`;
    if (focus) workspace.querySelector(`#at-tab-${id}`).focus();
    saveState(state);
  }

  function updateTable() { workspace.querySelector('#district-rows').innerHTML = tableRows(territory,state); }

  function selectDistrict(id, origin = 'select') {
    if (id !== 'canton' && !territory.districts.some(d => d.id === id)) return;
    state.selected = id;
    const d = summary(territory,stats,id);
    updateMap(); updateTable();
    workspace.querySelector('#district-detail').innerHTML = inspector(d);
    saveState(state);
    announce(`${d.name}: ${number(d.coveragePct)} % comparable; diferencia media ${signed(d.delta)}.`);
    if (origin === 'table') {
      changeView('districts');
      const title = workspace.querySelector('#at-inspector-title');
      scrollTo(workspace.querySelector('#district-detail')); title.focus({preventScroll:true});
    } else if (['select','map'].includes(origin) && globalThis.matchMedia?.('(max-width: 1100px)').matches) {
      scrollTo(workspace.querySelector('#district-detail'));
      workspace.querySelector('#at-inspector-title').focus({preventScroll:true});
    }
  }

  function applyBox(next) {
    viewBox = next;
    map.setAttribute('viewBox',next.map(v => Number(v.toFixed(2))).join(' '));
    const factor = fullBox[2]/next[2];
    workspace.querySelector('#at-zoom-label').textContent = factor <= 1.001 ? 'Vista cantonal' : `Ampliación ${number(factor,1)}×`;
    workspace.querySelector('[data-at-zoom="out"]').disabled = factor <= 1.001;
    workspace.querySelector('[data-at-zoom="in"]').disabled = factor >= 4.49;
  }

  function focusDistrict() {
    const d = territory.districts.find(v => v.id === state.selected);
    if (!d) { applyBox([...fullBox]); return; }
    // Extensión del trazado de pantalla, sólo para encuadrar; no calcula áreas.
    const coordinates = [...d.svgPath.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m => [Number(m[1]),Number(m[2])]);
    const xs = coordinates.map(p => p[0]), ys = coordinates.map(p => p[1]);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const factor = Math.max(1,Math.min(4.5,Math.min(fullBox[2]/(maxX-minX+90),fullBox[3]/(maxY-minY+90))));
    applyBox([(minX+maxX)/2-fullBox[2]/factor/2,(minY+maxY)/2-fullBox[3]/factor/2,fullBox[2]/factor,fullBox[3]/factor]);
  }

  function zoom(direction) {
    const factor = Math.max(1,Math.min(4.5,fullBox[2]/viewBox[2]*(direction === 'in' ? 1.4 : 1/1.4)));
    if (factor <= 1.001) { applyBox([...fullBox]); return; }
    const d = territory.districts.find(v => v.id === state.selected);
    const center = d ? d.labelPoint : [viewBox[0]+viewBox[2]/2,viewBox[1]+viewBox[3]/2];
    applyBox([center[0]-fullBox[2]/factor/2,center[1]-fullBox[3]/factor/2,fullBox[2]/factor,fullBox[3]/factor]);
  }

  function copyFallback(text, description) {
    if (disposed) return;
    const panel = workspace.querySelector('.at-copy-fallback');
    panel.hidden = false;
    panel.querySelector('textarea').value = text;
    panel.querySelector('p').textContent = description || 'El navegador no permitió copiar automáticamente. Selecciona el texto y usa Copiar.';
    scrollTo(panel); panel.querySelector('textarea').focus(); panel.querySelector('textarea').select();
  }

  async function copyText(text) {
    copyTrigger = document.activeElement;
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      announce('Resultado copiado. Puedes pegarlo en tu informe.');
    } catch { copyFallback(text); }
  }

  function download(text, filename, type = 'text/csv;charset=utf-8') {
    copyTrigger = document.activeElement;
    let url;
    try {
      url = URL.createObjectURL(new Blob([text],{type})); urls.add(url);
      const anchor = document.createElement('a'); anchor.href=url; anchor.download=filename;
      document.body.append(anchor); anchor.click(); anchor.remove();
      defer(() => {URL.revokeObjectURL(url);urls.delete(url);},15000);
      announce(`Archivo preparado: ${filename}.`);
    } catch {
      if (url) {URL.revokeObjectURL(url);urls.delete(url);}
      copyFallback(text,`No se pudo iniciar la descarga de ${filename}. Copia el contenido y guárdalo con ese nombre.`);
    }
  }

  function thresholdText(v) {
    return `Con el criterio estricto MNDWI > ${number(v.threshold,1)} y ${number(v.commonHa)} ha válidas en ambas composiciones, ${number(v.onlyF2Ha)} ha superan el umbral únicamente en F2, ${number(v.onlyF1Ha)} ha únicamente en F1 y ${number(v.bothHa)} ha en ambas. ${number(v.neitherHa)} ha no lo superan en ninguna. El resultado mide la respuesta al umbral; no estima una superficie confirmada de inundación.`;
  }

  function closeImage() {
    const dialog=workspace.querySelector('.at-image-dialog');
    const wasOpen=dialog.hasAttribute('open');
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    if (wasOpen && !disposed && imageTrigger?.isConnected) imageTrigger.focus();
  }

  drawPaths(); applyBox([...fullBox]);
  on(workspace,'change',event => {
    const target = event.target;
    if (target.id === 'map-variable') { state.metric=target.value in METRICS ? target.value : 'coverage'; updateMap(); saveState(state); }
    else if (target.id === 'district-select') selectDistrict(target.value);
    else if (target.id === 'table-order') {state.order=target.value;updateTable();saveState(state);}
    else if (target.id === 'at-site-select') {state.site=target.value;workspace.querySelector('#at-site-result').innerHTML=siteResult(siteRows(sites).find(s => (s.id || s.id_sitio) === state.site));saveState(state);}
  });
  on(workspace,'input',event => {
    if (event.target.id === 'at-district-search') {state.query=event.target.value;updateTable();saveState(state);}
  });
  on(workspace,'click',event => {
    const district = event.target.closest?.('[data-district]');
    if (district) {selectDistrict(district.dataset.district,'map');return;}
    const button = event.target.closest?.('button');
    if (!button || !workspace.contains(button)) return;
    if (button.dataset.atView) changeView(button.dataset.atView);
    else if (button.dataset.atOpenView) {changeView(button.dataset.atOpenView,true);scrollTo(workspace.querySelector('.at-tabs'));}
    else if (button.dataset.rowDistrict) selectDistrict(button.dataset.rowDistrict,'table');
    else if (button.hasAttribute('data-at-reset')) {selectDistrict('canton','reset');applyBox([...fullBox]);}
    else if (button.dataset.atZoom) zoom(button.dataset.atZoom);
    else if (button.hasAttribute('data-at-fit')) focusDistrict();
    else if (button.hasAttribute('data-at-copy-report')) copyText(reportText(summary(territory,stats,state.selected),territory));
    else if (button.id === 'export-districts') download(csv([['codigo','distrito','area_cuadricula_ha','area_comparable_ha','cobertura_pct','ndvi_f1_comun','ndvi_f2_comun','delta_ndvi_comun'],...territory.districts.map(d => [d.code,d.name,d.areaHa,d.commonHa,d.coveragePct,d.meanF1,d.meanF2,d.delta])]),'San_Carlos_resumen_distrital.csv');
    else if (button.hasAttribute('data-threshold')) {
      const value=Number(button.dataset.threshold);const row=stats.thresholds.find(v => v.threshold === value);if(!row)return;
      state.threshold=value;workspace.querySelector('#threshold-result').innerHTML=thresholdResult(row);
      workspace.querySelectorAll('[data-threshold]').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.threshold) === value)));saveState(state);
    } else if (button.hasAttribute('data-at-copy-threshold')) copyText(thresholdText(stats.thresholds.find(v => v.threshold === state.threshold)));
    else if (button.hasAttribute('data-at-export-thresholds')) download(csv([['umbral_estricto','soporte_comun_ha','ninguna_ha','ambas_ha','solo_f2_ha','solo_f1_ha'],...stats.thresholds.map(v => [v.threshold,v.commonHa,v.neitherHa,v.bothHa,v.onlyF2Ha,v.onlyF1Ha])]),'San_Carlos_umbrales_MNDWI.csv');
    else if (button.hasAttribute('data-at-pair')) {
      const index=Number(button.dataset.atPair);if(!stats.datePairs[index])return;state.pair=index;
      workspace.querySelector('#at-date-result').innerHTML=dateResult(stats.datePairs[index]);workspace.querySelectorAll('[data-at-pair]').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.atPair) === index)));saveState(state);
    } else if (button.hasAttribute('data-at-copy-dates')) {const p=stats.datePairs[state.pair];copyText(`La pareja ${date(p.f1)}–${date(p.f2)}, con ${p.days} días entre adquisiciones, reúne ${number(p.areaHa)} ha (${number(p.sharePct)} % de las ${number(stats.coverage.commonHa)} ha comparables de NDVI). Cada pareja reúne celdas distintas; sus resultados no aíslan el efecto de la duración del intervalo.`);}
    else if (button.hasAttribute('data-at-export-dates')) download(csv([['fecha_f1','fecha_f2','intervalo_dias','celdas','area_ha','porcentaje_soporte_comun_ndvi','delta_ndvi_media'],...stats.datePairs.map(p => [p.f1,p.f2,p.days,p.cells,p.areaHa,p.sharePct,p.delta])]),'San_Carlos_fechas_observacion.csv');
    else if (button.dataset.atFigure) {
      imageTrigger=button;
      const dialog=workspace.querySelector('.at-image-dialog');dialog.querySelector('img').src=imagePath(button.dataset.atFigure);dialog.querySelector('img').alt=button.dataset.atCaption;dialog.querySelector('p').textContent=button.dataset.atCaption;
      if (typeof dialog.showModal === 'function') dialog.showModal();else {dialog.setAttribute('open','');dialog.querySelector('button').focus();}
    } else if (button.hasAttribute('data-at-close-image')) closeImage();
    else if (button.hasAttribute('data-at-select-copy')) {const field=workspace.querySelector('.at-copy-fallback textarea');field.focus();field.select();}
    else if (button.hasAttribute('data-at-close-copy')) {workspace.querySelector('.at-copy-fallback').hidden=true;if(copyTrigger?.isConnected)copyTrigger.focus();}
  });
  on(workspace,'keydown',event => {
    const district=event.target.closest?.('[data-district]');
    if (district && ['Enter',' '].includes(event.key)) {event.preventDefault();selectDistrict(district.dataset.district,'keyboard');}
    const tab=event.target.closest?.('[data-at-view]');
    if (tab && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();const index=VIEWS.findIndex(([id]) => id === tab.dataset.atView);
      const next=event.key === 'Home' ? 0 : event.key === 'End' ? VIEWS.length-1 : (index+(event.key === 'ArrowRight' ? 1 : -1)+VIEWS.length)%VIEWS.length;
      changeView(VIEWS[next][0],true);
    }
    if(event.key === 'Escape') {closeImage();const panel=workspace.querySelector('.at-copy-fallback');if(!panel.hidden){panel.hidden=true;if(copyTrigger?.isConnected)copyTrigger.focus();}}
  });
  on(workspace.querySelector('.at-image-dialog'),'click',event => {if(event.target===event.currentTarget)closeImage();});

  return () => {
    disposed=true;saveState(state);listeners.forEach(remove => remove());timers.forEach(clearTimeout);urls.forEach(url => URL.revokeObjectURL(url));
    const dialog=workspace.querySelector('.at-image-dialog');if(dialog.hasAttribute('open'))closeImage();
  };
}
