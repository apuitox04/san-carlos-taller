/* San Carlos · presentación web. API con índice base cero; rutas base uno.
 * El contenido original y sus cifras se conservan en slides.json.
 * Notas propias locales: no se transmiten a un servidor.
 */
let notesVisible = false;
let projectionActive = false;
let ownsNativeFullscreen = false;
let focusAfterNavigation = false;
let notesCache;
let notesStorageAvailable = true;
const panels = new Map();
const NOTES_KEY = 'san-carlos-taller:presentacion:notas:v1';
const LAST_KEY = 'san-carlos-taller:presentacion:ultima:v2';
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const indexOf = (slides, index) => Math.min(Math.max(0, Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0), Math.max(0, slides.length - 1));
const asset = path => /^assets\/media\/[A-Za-z0-9_.-]+\.webp$/.test(path || '') ? path : '';
const route = index => `#/presentacion/${index + 1}`;
const fmt = (value, digits = 2) => value === null || value === undefined ? 'NoData' : new Intl.NumberFormat('es-ES', {minimumFractionDigits:digits, maximumFractionDigits:digits}).format(value).replace('-', '−');
const date = value => value ? new Date(value + 'T12:00:00Z').toLocaleDateString('es-CR', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : '';
const icon = name => `<svg class="sc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${({left:'<path d="m14 5-7 7 7 7"/>',right:'<path d="m10 5 7 7-7 7"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',play:'<path d="m8 4 12 8-12 8Z"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',note:'<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>',print:'<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7z"/>',back:'<path d="m9 5-7 7 7 7M2 12h15a5 5 0 0 1 5 5"/>'})[name] || ''}</svg>`;
const smallLabel = text => `<span class="sc-label">${esc(text)}</span>`;
const bulletCards = (items, labels = []) => `<div class="sc-fact-cards">${(items || []).map((item,i) => `<div class="sc-fact-card">${smallLabel(labels[i] || String(i+1).padStart(2,'0'))}<p>${esc(item)}</p></div>`).join('')}</div>`;

function crop(slide, rect, suffix = 'map') {
  const image = asset(slide.figure);
  const size = slide.imageSize || [1800,989];
  if (!image || !rect) return '';
  const safe = rect.map(Number);
  if (safe.some(n => !Number.isFinite(n)) || safe[2] <= 0 || safe[3] <= 0) return '';
  return `<svg class="sc-map-window" viewBox="${safe.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="sc-map-${esc(slide.id)}-${suffix}"><title id="sc-map-${esc(slide.id)}-${suffix}">${esc(slide.figureAlt || slide.title)}</title><image href="${image}" width="${Number(size[0])}" height="${Number(size[1])}"/></svg>`;
}

function miniChart(site) {
  const bands = ['B03','B04','B08','B11'];
  const obs = site.observaciones;
  const ymax = 0.7, left = 52, top = 20, height = 180;
  const grid = [0,.2,.4,.6].map(v => `<g><line x1="${left}" x2="410" y1="${top+height-v/ymax*height}" y2="${top+height-v/ymax*height}" stroke="#dce5ec"/><text x="40" y="${top+height-v/ymax*height+5}" text-anchor="end">${fmt(v,1)}</text></g>`).join('');
  const bars = bands.map((band,i) => {
    const x = left+24+i*86;
    return ['f1','f2'].map((f,j) => {
      const value = obs[f].reflectancias[band], bh = value/ymax*height;
      return `<rect x="${x+j*28}" y="${top+height-bh}" width="24" height="${bh}" fill="${j?'#087f8c':'#bd5a32'}"><title>${esc(site.id_sitio)} ${f.toUpperCase()} ${band}: ${fmt(value,9)}</title></rect>`;
    }).join('')+`<text x="${x+26}" y="229" text-anchor="middle">${band}</text>`;
  }).join('');
  return `<svg class="sc-spectral-plot" viewBox="0 0 430 245" role="img" aria-label="Reflectancias de ${esc(site.distrito)} en F1 y F2; misma escala de cero a 0,7.">${grid}${bars}</svg>`;
}

function cover(slide) {
  const organizer = slide.organizer;
  const participation = slide.participation;
  const facilitator = slide.facilitator;
  return `<div class="sc-cover-copy">${organizer?`<p class="sc-cover-organizer"><span>${esc(organizer.institution)}</span><strong>${esc(organizer.unit)}</strong></p>`:''}${smallLabel(participation?`${participation.label} · ${participation.audience}`:'San Carlos · Costa Rica')}<h1 data-slide-heading tabindex="-1"><span>San Carlos</span>Revisión territorial</h1><p class="sc-cover-subtitle">Imágenes Sentinel-2, datos oficiales IGN/SNIT y QGIS.</p><p class="sc-cover-question">${esc(slide.body)}</p><div class="sc-cover-facts"><span><strong>13</strong> distritos</span><span><strong>6</strong> prácticas</span><span><strong>1</strong> jornada</span></div>${facilitator?`<p class="sc-cover-facilitator"><span>Facilitador</span><strong>${esc(facilitator.name)}</strong> · ${esc(facilitator.profession)}</p>`:''}</div><figure class="sc-cover-map"><img src="assets/media/00_mapa_portada_sin_rotulos.webp" alt="Cartografía real del cantón San Carlos: relieve y NDVI, con los trece distritos." decoding="async"><figcaption>Cartografía del expediente · IGN/SNIT / Sentinel-2</figcaption></figure>`;
}

function dateMatrix(slide) {
  const pairs = slide.datePairs || [];
  return `<div class="sc-date-matrix" role="table" aria-label="Parejas de adquisiciones de 2025"><div class="sc-date-corner" role="columnheader">F1 ↓ / F2 →</div>${['8 jul','7 ago','12 ago'].map(v=>`<div class="sc-date-heading" role="columnheader">${v} 2025</div>`).join('')}${['23 feb','20 mar'].map(f1=>`<div class="sc-date-heading sc-date-row" role="rowheader">${f1}<br>2025</div>${pairs.filter(p=>p.f1===f1).map(p=>`<div class="sc-date-cell${p.share>50?' is-dominant':''}" role="cell"><strong>${fmt(p.share)}<small> %</small></strong><span>${fmt(p.ha)} ha</span><em>${p.days} días</em></div>`).join('')}`).join('')}</div><p class="sc-method-line">Denominador: <strong>199.199,56 ha comparables de NDVI</strong>. Cada pareja ocupa un territorio diferente.</p>`;
}

function siteView(slide) {
  const site = slide.site;
  if (!site) return '';
  const list = slide.imagePanels || [];
  const chosen = list.find(p=>p.id===(panels.get(slide.id)||'indice')) || list[0];
  const obs = site.observaciones;
  const isWater = site.id_sitio==='S03';
  const index = isWater?'mndwi':'ndvi';
  const value = site.comparacion.delta_ndvi;
  const labels = {'S02':'Comparación excluida','S03':'Clase 2 · sólo F2','S05':'ΔNDVI = −0,765157'};
  const decisions = {'S02':'F1 tiene SCL 4, pero margen seguro 0. La ausencia se conserva como NoData.','S03':'MNDWI supera 0,1 únicamente en F2. La presencia de agua requiere comprobación.','S05':'El rojo aumenta proporcionalmente más que el NIR. Se revisa la imagen antes de atribuir una causa.'};
  return `<div class="sc-site-layout"><div class="sc-site-art"><div class="sc-image-tabs" role="group" aria-label="Vista de ${esc(site.distrito)}">${list.map(p=>`<button class="sc-tab${p.id===chosen.id?' is-active':''}" type="button" data-figure-panel="${esc(p.id)}" aria-pressed="${p.id===chosen.id}">${esc(p.label)}</button>`).join('')}</div><div class="sc-site-window">${crop(slide,chosen.rect,chosen.id)}</div><p class="sc-map-caption">${chosen.id==='contexto'?'Falso color: 6 × 6 km por composición.':'Detalle del índice: 600 × 600 m. El recuadro marca la celda real de 20 m.'}</p></div><aside class="sc-site-reading">${smallLabel(site.id_sitio+' · '+site.distrito)}${['f1','f2'].map(f=>`<div class="sc-observation"><div><strong>${f.toUpperCase()}</strong><span>${esc(date(obs[f].fecha))}</span></div><p>${index.toUpperCase()} <b>${fmt(obs[f].indices[index],6)}</b></p><small>SCL ${obs[f].scl} · margen seguro ${obs[f].margen_seguro}</small></div>`).join('')}<div class="sc-decision${value===null?' is-excluded':''}"><strong>${labels[site.id_sitio]}</strong><p>${decisions[site.id_sitio]}</p></div></aside></div>`;
}

function districtMap(slide) {
  const delta = slide.id==='D16';
  const legend = delta ? `<div class="sc-delta-gradient" aria-hidden="true"></div><div class="sc-gradient-labels"><span>−0,30</span><span>0</span><span>+0,30</span></div><p class="sc-map-small">Saturación visual en ±0,30; valores originales conservados.</p>` : `<p class="sc-map-key"><i style="background:#175e56"></i>Válida en F1 y F2</p>`;
  return `<div class="sc-map-layout"><div class="sc-map-art">${crop(slide,slide.crop)}</div><div class="sc-map-reading">${smallLabel(delta?'Diferencia entre composiciones':'Superficie comparable')}<div class="sc-map-number">199.199,56<span> ha</span></div><p class="sc-map-subnumber">59,43 % de la cuadrícula cantonal</p>${legend}<p class="sc-map-key"><i style="background:#c3cdd2"></i>Sin comparación válida</p>${delta?'<p class="sc-map-result">Media de ΔNDVI <strong>+0,057786</strong></p>':'<p class="sc-map-result">Superficie excluida <strong>136.004,16 ha</strong></p>'}<div class="sc-district-key">${(slide.districts||[]).map(d=>`<span><b>${esc(d.code)}</b> ${esc(d.name)}</span>`).join('')}</div></div></div>`;
}

function coverage(slide) {
  return `<div class="sc-coverage-chart"><div class="sc-coverage-labels"><span>Distrito</span><span>Superficie comparable / excluida</span><span>Cobertura</span></div>${(slide.districtData||[]).map(d=>`<div class="sc-coverage-row${d.coverage<40?' is-low':''}"><span>${esc(d.name)}</span><div class="sc-coverage-track" role="img" aria-label="${esc(d.name)}: ${fmt(d.coverage)} por ciento comparable"><i style="width:${d.coverage}%"></i><b class="sc-canton-line" style="left:59.42641686673406%"></b></div><strong>${fmt(d.coverage)} %</strong></div>`).join('')}<div class="sc-coverage-legend"><span><i></i>Comparable</span><span><i></i>Excluida</span><span><b></b>Cantón: 59,43 %</span></div></div><p class="sc-method-line">Denominador: todas las celdas de cada distrito. Los distritos con menos del 40 % de cobertura permiten desarrollar S06.</p>`;
}

function weight(slide) {
  return `<div class="sc-weight-layout"><div class="sc-weight-chart">${smallLabel('Peso en la superficie comparable cantonal')}${(slide.districtData||[]).map((d,i)=>`<div class="sc-weight-row"><span>${esc(d.name)}</span><div><i style="width:${d.weight/30*100}%;background:${i<2?'#087f8c':'#adc2ce'}"></i><b style="left:${(100/13)/30*100}%"></b></div><strong>${fmt(d.weight)} %</strong></div>`).join('')}<p class="sc-map-small">Línea: 7,69 % por distrito en el promedio simple.</p></div><div class="sc-weight-results"><div>${smallLabel('Igual peso por distrito')}<strong>0,044342</strong><p>Promedio de las trece medias distritales.</p></div><div>${smallLabel('Igual peso por celda')}<strong>0,057786</strong><p>Media de las celdas comparables de San Carlos.</p></div><p class="sc-weight-callout"><b>Cutris + Pocosol: 45,44 %</b> de la superficie comparable.</p></div></div>`;
}

function content(slide, print=false) {
  const bullets = slide.bullets || [];
  switch(slide.layout) {
    case 'cover': return cover(slide);
    case 'deliverables': return `<div class="sc-deliverable-cards">${bullets.map((t,i)=>`<article>${smallLabel(['01 · Informe','02 · Tabla y mapa','03 · Proyecto QGIS'][i])}<div class="sc-document-symbol" aria-hidden="true">${icon(i===0?'note':i===1?'grid':'expand')}</div><p>${esc(t)}</p></article>`).join('')}</div><p class="sc-outcome">Cantidad · unidad · ámbito · procedencia</p>`;
    case 'agenda': return `<div class="sc-agenda">${[['P01','Territorio oficial','08:10–08:50','40'],['P02','Observación y calidad','08:50–09:45','55'],['P03','Cálculo de índices','10:00–11:10','70'],['P04','Comparación temporal','11:10–12:00 / 13:00–13:20','70'],['P05','Resumen distrital','13:20–14:25','65'],['P06','Informe y cartografía','14:40–15:50','70']].map(a=>`<a href="#/practicas/${a[0]}" class="sc-agenda-item"><b>${a[0]}</b><div><strong>${a[1]}</strong><span>${a[2]}</span></div><em>${a[3]} min</em></a>`).join('')}</div><div class="sc-agenda-totals"><span>Inicio <b>08:00</b> · cierre <b>16:00</b></span><span><b>390 min</b> de trabajo + <b>90 min</b> de pausas</span></div>`;
    case 'source': return `<div class="sc-source-layout"><div class="sc-source-passport">${smallLabel('Delimitación del expediente')}<h2>IGN <span>/ Registro Nacional</span></h2><dl><div><dt>Publicación</dt><dd>SNIT · servicio WFS IGN_5_CO</dd></div><div><dt>Cantón</dt><dd>210 · San Carlos</dd></div><div><dt>Distritos</dt><dd>21001–21013</dd></div><div><dt>Sistema</dt><dd>EPSG:8908<br>CR-SIRGAS / CRTM05</dd></div></dl></div><div class="sc-source-dates"><article>${smallLabel('Identificador de versión')}<strong>20260410001</strong><p>Se conserva como identificador del dato.</p></article><article>${smallLabel('Consulta del servicio')}<strong>11 oct 2026</strong><p>La misma división territorial se aplica a las dos composiciones de 2025.</p></article></div></div>`;
    case 'grid': return `<div class="sc-grid-layout"><div class="sc-cell-diagram"><svg viewBox="0 0 330 300" role="img" aria-label="Esquema de una celda cuadrada de 20 por 20 metros, equivalente a 400 metros cuadrados."><defs><pattern id="sc-grid-pattern" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#dce5ec" stroke-width="1"/></pattern></defs><rect x="20" y="20" width="290" height="250" fill="url(#sc-grid-pattern)"/><rect x="82" y="60" width="164" height="164" fill="#087f8c"/><path d="M82 245H246M82 237V253M246 237V253" stroke="#142e43" stroke-width="2"/><text x="164" y="278" text-anchor="middle">20 m</text><text x="164" y="139" text-anchor="middle" fill="white" class="sc-cell-main">400 m²</text><text x="164" y="172" text-anchor="middle" fill="white">0,04 ha</text><text x="63" y="148" text-anchor="middle" transform="rotate(-90 63 148)">20 m</text></svg><span>Unidad de conteo · esquema de la cuadrícula</span></div><div class="sc-grid-totals"><div>${smallLabel('Geometría vectorial')}<strong>3.352,135231 <small>km²</small></strong></div><div>${smallLabel('Cuadrícula cantonal')}<strong>8.380.093 <small>celdas</small></strong><p>× 0,04 ha = <b>335.203,72 ha</b></p></div><p class="sc-decision-text">Los porcentajes de cobertura usan la superficie de la cuadrícula.</p></div></div>`;
    case 'practice': return `<div class="sc-practice-layout"><div class="sc-practice-number"><span>Práctica</span><strong>${esc(slide.practice)}</strong><p>${slide.minutes} minutos de trabajo</p><a class="sc-practice-open" href="#/practicas/${esc(slide.practice)}">Abrir ejercicio ${icon('right')}</a></div><div class="sc-practice-steps">${bullets.map((t,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><p>${esc(t)}</p></div>`).join('')}<p class="sc-practice-save">Conservar resultados y decisiones en el expediente de trabajo.</p></div></div>`;
    case 'bands': return `<div class="sc-band-grid">${[['1','B03','Verde','MNDWI','#46956e'],['2','B04','Rojo','NDVI / SAVI','#bd5a32'],['3','B08','Infrarrojo cercano','NDVI / SAVI','#087f8c'],['4','B11','Infrarrojo de onda corta','MNDWI','#526aa0']].map(b=>`<article style="--band:${b[4]}"><span>Banda del archivo <b>${b[0]}</b></span><strong>${b[1]}</strong><h2>${b[2]}</h2><p>${b[3]}</p></article>`).join('')}</div><div class="sc-radiometry"><span>Float32</span><span>Escala <b>1</b></span><span>Desplazamiento <b>0</b></span><span>Cuadrícula <b>20 m</b></span></div><p class="sc-method-line">Una adquisición por celda: bandas, SCL, fecha y fuente permanecen vinculadas.</p>`;
    case 'dates': return dateMatrix(slide);
    case 'site': return siteView(slide);
    case 'formulas': return `<div class="sc-formulas">${[['NDVI','B08 − B04','B08 + B04','NIR / rojo'],['SAVI','1,5 × (B08 − B04)','B08 + B04 + 0,5','L = 0,5'],['MNDWI','B03 − B11','B03 + B11','Verde / SWIR']].map(f=>`<article><h2>${f[0]}</h2><div class="sc-fraction" aria-label="${f[0]} igual a ${f[1]} dividido por ${f[2]}"><span>${f[1]}</span><span>${f[2]}</span></div><p>${f[3]}</p></article>`).join('')}</div><div class="sc-formula-condition">Territorio + calidad + bandas positivas + denominador suficiente</div>`;
    case 'spectral': return `<div class="sc-spectral-legend"><span><i style="background:#bd5a32"></i>F1 · 20 mar 2025</span><span><i style="background:#087f8c"></i>F2 · 7 ago 2025</span><em>Reflectancia de superficie · misma escala</em></div><div class="sc-spectral-pair">${(slide.spectralSites||[]).map(site=>`<article><h2>${esc(site.id_sitio+' · '+site.distrito)}</h2>${miniChart(site)}<p>${site.id_sitio==='S01'?'NDVI: 0,880920 → 0,884666<br>SAVI: 0,639184 → 0,631624':'B08 y B04 aumentan; el rojo aumenta proporcionalmente más.'}</p></article>`).join('')}</div><p class="sc-method-line">SAVI = 1,5 × NDVI × S / (S + 0,5), con S = B08 + B04.</p>`;
    case 'nodata': return `<div class="sc-nodata-grid"><article>${smallLabel('F1 · S02')}<strong>NoData</strong><p>SCL 4<br>Margen seguro 0</p><span class="sc-status-chip is-excluded">Observación excluida</span></article><div class="sc-nodata-plus" aria-hidden="true">→</div><article>${smallLabel('F2 · S02')}<strong>0,721215</strong><p>NDVI válido<br>Margen seguro 1</p><span class="sc-status-chip">Observación aceptada</span></article><div class="sc-nodata-plus" aria-hidden="true">→</div><article class="sc-nodata-result">${smallLabel('Diferencia F2 − F1')}<strong>NoData</strong><p>Falta una observación aceptada para comparar.</p></article></div><div class="sc-nodata-rule"><b>0</b><p>Un resultado numérico participa en las estadísticas.</p><b>NoData</b><p>Conserva la exclusión del método.</p></div>`;
    case 'map': return districtMap(slide);
    case 'threshold': return `<div class="sc-threshold-chart"><div class="sc-threshold-axis"><span>400</span><span>300</span><span>200</span><span>100</span><span>0 ha</span></div><div class="sc-threshold-bars">${(slide.thresholds||[]).map((d,i)=>`<div class="sc-threshold-column"><div class="sc-threshold-bar-space"><div class="sc-threshold-bar${i===1?' is-reference':''}" style="height:${d.onlyF2/400*100}%"><strong>${fmt(d.onlyF2)} <small>ha</small></strong></div></div><span>Umbral &gt; ${fmt(d.threshold,1)}</span><em>${['+79,35 %','Referencia','−21,47 %'][i]}</em></div>`).join('')}</div></div><p class="sc-method-line">Categoría «sólo F2» · F1 ≤ umbral y F2 &gt; umbral. Superficie comparable constante: <strong>199.327,32 ha</strong>.</p>`;
    case 'join': return `<div class="sc-join-layout"><article><h2>Distrito oficial</h2><dl><div><dt>nombre</dt><dd>Quesada</dd></div><div><dt>cod_dta</dt><dd>21001</dd></div><div class="is-key"><dt>raster_code</dt><dd>1</dd></div></dl></article><div class="sc-join-sign" aria-label="unir por igualdad">=</div><article><h2>Estadística ráster</h2><dl><div class="is-key"><dt>zone</dt><dd>1</dd></div><div><dt>delta_count</dt><dd>286.476</dd></div><div><dt>total_count</dt><dd>358.708</dd></div></dl></article></div><div class="sc-join-calculations"><p><strong>11.459,04 ha</strong><span>286.476 × 0,04</span></p><p><strong>79,86 %</strong><span>100 × 286.476 / 358.708</span></p></div><p class="sc-method-line">Capa de zonas: Distritos_20m. Referencia: Capa de entrada (REF_LAYER = 0).</p>`;
    case 'coverage': return coverage(slide);
    case 'weight': return weight(slide);
    case 'argument': return `<div class="sc-argument-columns">${[['01','Observación','MNDWI: −0,608245 → 0,470069','S03 · 20 mar → 8 jul 2025'],['02','Interpretación','El contraste verde–SWIR cruza el umbral.','La presencia de agua queda como hipótesis.'],['03','Comprobación','Imagen contemporánea de mayor detalle.','Observaciones anteriores y posteriores al 8 de julio.']].map(a=>`<article><span>${a[0]}</span><h2>${a[1]}</h2><strong>${a[2]}</strong><p>${a[3]}</p></article>`).join('')}</div><p class="sc-method-line">La misma estructura se aplica a una observación válida y a una exclusión documentada.</p>`;
    case 'transfer': return `<div class="sc-transfer-layout"><div><div class="sc-transfer-step"><b>01</b><p>Elegir un distrito con <strong>cobertura &lt; 40 %</strong>.</p></div><div class="sc-low-districts"><span>Buenavista</span><span>La Fortuna</span><span>La Tigra</span><span>Venado</span></div><div class="sc-transfer-step"><b>02</b><p>Registrar el criterio antes de consultar los índices.</p></div><div class="sc-transfer-step"><b>03</b><p>Documentar centro de celda, calidad, fechas y decisión.</p></div></div><div class="sc-transfer-coordinate">${smallLabel('Centro de la celda · EPSG:8908')}<code>E = 20 × piso(E / 20) + 10<br>N = 20 × piso(N / 20) + 10</code><p>Aplicable a la cuadrícula entregada, alineada con múltiplos de 20 m.</p><strong>S06 puede quedar excluido.</strong><span>La respuesta se evalúa por su trazabilidad.</span></div></div>`;
    case 'comparison': return `<div class="sc-comparison-map">${crop(slide,slide.crop,'pair')}</div><p class="sc-method-line">Mismo encuadre y escala de color. El producto final del participante es el mapa cantonal de ΔNDVI.</p>`;
    case 'review': return `<div class="sc-review-list">${bullets.map((b,i)=>`<article><span>${String(i+1).padStart(2,'0')}</span><div><h2>${['Reconstruir la cifra','Localizar la observación','Examinar la interpretación'][i]}</h2><p>${esc(b)}</p></div></article>`).join('')}</div><p class="sc-outcome">La revisión termina con una corrección concreta en el informe.</p>`;
    case 'closure': return `<div class="sc-closure-layout"><div class="sc-closure-heading">El expediente<br>queda documentado.</div><div>${bullets.map((b,i)=>`<p><span>${String(i+1).padStart(2,'0')}</span>${esc(b)}</p>`).join('')}<a href="#/practicas/P06" class="sc-practice-open">Volver a la entrega P06 ${icon('right')}</a></div></div>${slide.organizer?`<div class="sc-workshop-attribution"><p><strong>${esc(slide.organizer.unit)}</strong><span>${esc(slide.organizer.institution)}</span></p>${slide.participation?`<p><strong>${esc(slide.participation.label)}</strong><span>${esc(slide.participation.audience)}</span></p>`:''}${slide.facilitator?`<p><strong>Facilitador: ${esc(slide.facilitator.name)}</strong><span>${esc(slide.facilitator.profession)}</span></p>`:''}</div>`:''}`;
    default: return bulletCards(bullets);
  }
}

function renderSlide(slide, index, total, print=false) {
  const layout = slide.layout || 'default';
  const figure = asset(slide.figure);
  const credit = slide.figureCredit || 'Ejercicio docente · San Carlos · Sentinel-2 / IGN–SNIT';
  const coverSlide = layout==='cover';
  return `<article class="sc-slide sc-layout-${esc(layout)}" aria-label="Diapositiva ${index+1} de ${total}" data-layout="${esc(layout)}">
    ${coverSlide?'':`<header class="sc-slide-header">${smallLabel(slide.kicker)}<${print?'h2':'h1'} ${print?'':'data-slide-heading tabindex="-1"'}>${esc(slide.title)}</${print?'h2':'h1'}><p>${esc(slide.body)}</p></header>`}
    <div class="sc-slide-content">${content(slide,print)}</div>
    <footer class="sc-slide-footer"><span>${esc(credit)}</span><div>${figure&&!print?`<button type="button" class="sc-figure-link" data-deck-figure aria-haspopup="dialog">${icon('expand')}Lámina original</button>`:''}<b>${index+1}<small> / ${total}</small></b></div></footer>
  </article>`;
}

function indexDialog(slides, active) {
  const chapters=[];
  slides.forEach((s,i)=>{const id=s.chapter?.id||'Taller';let group=chapters.find(c=>c.id===id);if(!group){group={id,title:s.chapter?.title||'Presentación',slides:[]};chapters.push(group);}group.slides.push({s,i});});
  return `<dialog class="sc-index-dialog" data-index-dialog aria-labelledby="sc-index-title"><header class="sc-dialog-header"><div>${smallLabel('Presentación · 30 diapositivas')}<h2 id="sc-index-title">Elegir una diapositiva</h2></div><button type="button" class="sc-button sc-icon-button" data-index-close aria-label="Cerrar índice">${icon('close')}</button></header><div class="sc-index-chapters">${chapters.map(ch=>`<section><h3><span>${esc(ch.id)}</span>${esc(ch.title)}</h3><div class="sc-index-grid">${ch.slides.map(({s,i})=>`<a class="sc-index-card${i===active?' is-current':''}" href="${route(i)}" data-deck-index ${i===active?'aria-current="step"':''}><div class="sc-index-preview ${s.layout==='cover'?'is-cover':''}">${asset(s.figure)?`<img src="${asset(s.figure)}" alt="" loading="lazy" decoding="async">`:`<span>${esc(s.practice||s.chapter?.id||'SC')}</span><i>${esc(s.layout==='formulas'?'NDVI / SAVI / MNDWI':s.body||s.title)}</i>`}<b>${String(i+1).padStart(2,'0')}</b></div><strong>${esc(s.title)}</strong><small>${s.minutes} min${s.practice?' · trabajo en QGIS':''}</small></a>`).join('')}</div></section>`).join('')}</div></dialog>`;
}

export function renderPresentation(slides, index=0) {
  if(!Array.isArray(slides)||!slides.length)return '<section class="sc-presenter"><p role="status">La presentación no contiene diapositivas.</p></section>';
  const active=indexOf(slides,index), slide=slides[active], figure=asset(slide.figure);
  return `<link rel="stylesheet" href="assets/presentation.css?v=1.2.0" data-presentation-style><section class="sc-presenter${projectionActive?' is-projecting':''}" aria-label="Presentación del taller San Carlos" tabindex="-1">
    <div class="sc-deck-context"><a href="#/inicio">${icon('back')}Taller San Carlos</a><div><span>${esc(slide.chapter?.id||'Taller')} · ${esc(slide.chapter?.title||slide.kicker)}</span><span>${slide.minutes} min${slide.practice?' de trabajo':''}</span></div><div class="sc-secondary-actions"><button type="button" class="sc-text-button" data-deck-notes-toggle aria-expanded="${notesVisible}" aria-controls="sc-speaker-notes">${icon('note')}<span>${notesVisible?'Ocultar notas':'Notas del ponente'}</span></button><button type="button" class="sc-text-button" data-deck-print>${icon('print')}<span>Imprimir</span></button></div></div>
    <div class="sc-deck-toolbar" role="group" aria-label="Navegar por la presentación"><button type="button" class="sc-button sc-nav-button" data-deck-prev ${active===0?'disabled':''} aria-label="Diapositiva anterior">${icon('left')}<span>Anterior</span></button><button type="button" class="sc-button sc-index-button" data-index-open aria-haspopup="dialog">${icon('grid')}<span>Índice</span><b>${active+1}<small> / ${slides.length}</small></b></button><button type="button" class="sc-button sc-nav-button" data-deck-next ${active===slides.length-1?'disabled':''} aria-label="Diapositiva siguiente"><span>Siguiente</span>${icon('right')}</button><button type="button" class="sc-button sc-primary-button" data-deck-project aria-pressed="${projectionActive}">${icon(projectionActive?'close':'play')}<span>${projectionActive?'Salir':'Presentar'}</span></button></div>
    <div class="sc-deck-progress" aria-hidden="true"><i style="width:${(active+1)/slides.length*100}%"></i></div>
    <div class="sc-stage" tabindex="0" aria-label="Diapositiva activa. Usa las flechas para cambiar de diapositiva.">${renderSlide(slide,active,slides.length)}</div>
    <div class="sc-deck-underbar"><p>${active<slides.length-1?`Sigue: <strong>${esc(slides[active+1].title)}</strong>`:'Fin de la presentación · informe, tabla, mapa y proyecto.'}</p><p><kbd>←</kbd><kbd>→</kbd><span> o espacio</span></p><p data-deck-status role="status" aria-live="polite"></p></div>
    <section class="sc-deck-notes" id="sc-speaker-notes" ${notesVisible?'':'hidden'} aria-label="Guion del ponente"><header><div>${smallLabel('Guion del ponente')}<h2>${esc(slide.title)}</h2></div><strong>${slide.minutes} min</strong></header><div class="sc-speaker-sections">${(slide.notesSections?.length?slide.notesSections:[{label:'Desarrollo',text:slide.notes||''}]).map((s,i)=>`<article><h3><span>${String(i+1).padStart(2,'0')}</span>${esc(s.label)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div><details class="sc-personal-notes"><summary>Añadir notas propias</summary><label for="sc-note-${esc(slide.id)}">Notas para esta diapositiva</label><textarea id="sc-note-${esc(slide.id)}" data-personal-note rows="5" placeholder="Ejemplos, preguntas o ajustes para tu sesión."></textarea><div><small data-note-storage role="status" aria-live="polite">Se guardan en este navegador.</small><button type="button" class="sc-button" data-export-notes>Descargar notas propias</button></div></details></section>
    ${indexDialog(slides,active)}
    ${figure?`<dialog class="sc-figure-dialog" data-figure-dialog aria-labelledby="sc-figure-heading"><header class="sc-dialog-header"><div>${smallLabel('Lámina del expediente')}<h2 id="sc-figure-heading">${esc(slide.title)}</h2></div><button type="button" class="sc-button sc-icon-button" data-figure-close aria-label="Cerrar figura ampliada">${icon('close')}</button></header><div class="sc-zoom-controls" role="group" aria-label="Escala de la lámina"><button class="sc-tab is-active" type="button" data-figure-zoom="1" aria-pressed="true">Ajustar</button><button class="sc-tab" type="button" data-figure-zoom="2" aria-pressed="false">×2</button><button class="sc-tab" type="button" data-figure-zoom="3" aria-pressed="false">×3</button><a href="${figure}" target="_blank" rel="noopener">Abrir imagen original ↗</a></div><div class="sc-image-scroll"><img src="${figure}" alt="${esc(slide.figureAlt||slide.title)}" decoding="async" data-zoom-image></div><p class="sc-dialog-credit">${esc(slide.figureCredit||'Datos del expediente San Carlos.')}</p></dialog>`:''}
  </section>`;
}

function readNotes(){if(notesCache)return notesCache;notesCache={};try{const raw=localStorage.getItem(NOTES_KEY);const parsed=raw?JSON.parse(raw):{};if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))notesCache=parsed;}catch{notesStorageAvailable=false;}return notesCache;}
function leaveProjection(){projectionActive=false;document.documentElement.classList.remove('sc-deck-projecting');document.querySelectorAll('.sc-presenter.is-projecting').forEach(el=>el.classList.remove('is-projecting'));if(ownsNativeFullscreen&&document.fullscreenElement&&typeof document.exitFullscreen==='function')document.exitFullscreen().catch(()=>{});ownsNativeFullscreen=false;}

export function bindPresentation(root,slides,index=0){
  if(!root||!Array.isArray(slides)||!slides.length)return()=>{};
  const active=indexOf(slides,index),slide=slides[active],disposers=[];
  const personalNotes=readNotes(),field=root.querySelector('[data-personal-note]'),storeStatus=root.querySelector('[data-note-storage]'),status=root.querySelector('[data-deck-status]');
  let disposed=false,printCleanup=null;
  const listen=(el,type,handler,options)=>{el.addEventListener(type,handler,options);disposers.push(()=>el.removeEventListener(type,handler,options));};
  const notify=message=>{if(status&&!disposed)status.textContent=message;};
  try{sessionStorage.setItem(LAST_KEY,String(active));}catch{}
  if(field)field.value=typeof personalNotes[slide.id]==='string'?personalNotes[slide.id]:'';
  if(!notesStorageAvailable&&storeStatus)storeStatus.textContent='Guardado local no disponible. Descarga tus notas antes de salir.';
  if(focusAfterNavigation){root.querySelector('[data-slide-heading]')?.focus({preventScroll:true});focusAfterNavigation=false;}
  const updateProjection=()=>{const shell=root.querySelector('.sc-presenter');shell?.classList.toggle('is-projecting',projectionActive);root.querySelectorAll('[data-deck-project]').forEach(button=>{button.innerHTML=icon(projectionActive?'close':'play')+`<span>${projectionActive?'Salir':'Presentar'}</span>`;button.setAttribute('aria-pressed',String(projectionActive));button.title=projectionActive?'Salir de la vista de proyección':typeof document.documentElement.requestFullscreen==='function'&&document.fullscreenEnabled!==false?'Presentar en pantalla completa':'Abrir la vista de proyección';});};
  updateProjection();
  const navigate=target=>{const next=indexOf(slides,target);if(next===active)return;focusAfterNavigation=true;window.location.hash=route(next);};
  const toggleProjection=async()=>{if(projectionActive){leaveProjection();updateProjection();return;}projectionActive=true;document.documentElement.classList.add('sc-deck-projecting');updateProjection();root.querySelector('.sc-stage')?.focus({preventScroll:true});if(!document.fullscreenElement&&typeof document.documentElement.requestFullscreen==='function'&&document.fullscreenEnabled!==false){ownsNativeFullscreen=true;try{await document.documentElement.requestFullscreen();if(disposed&&!/^#\/presentacion(?:\/|$)/.test(window.location.hash)&&document.fullscreenElement===document.documentElement){ownsNativeFullscreen=true;leaveProjection();}}catch{ownsNativeFullscreen=false;notify('Vista de proyección activada. El navegador conserva sus controles.');}}};
  const toggleNotes=()=>{notesVisible=!notesVisible;const pane=root.querySelector('#sc-speaker-notes');if(pane)pane.hidden=!notesVisible;const button=root.querySelector('[data-deck-notes-toggle]');if(button){button.setAttribute('aria-expanded',String(notesVisible));button.innerHTML=icon('note')+`<span>${notesVisible?'Ocultar notas':'Notas del ponente'}</span>`;}};
  const saveNote=()=>{if(!field)return;personalNotes[slide.id]=field.value;try{localStorage.setItem(NOTES_KEY,JSON.stringify(personalNotes));notesStorageAvailable=true;if(storeStatus)storeStatus.textContent='Guardado en este navegador.';}catch{notesStorageAvailable=false;if(storeStatus)storeStatus.textContent='Disponible durante esta sesión. Descarga la nota para conservarla.';}};
  const exportNotes=()=>{const written=slides.filter(s=>typeof personalNotes[s.id]==='string'&&personalNotes[s.id].trim());if(!written.length){if(storeStatus)storeStatus.textContent='Escribe una nota antes de descargar.';return;}const text=['SAN CARLOS · NOTAS PROPIAS DE LA PRESENTACIÓN','',...written.flatMap(s=>[s.id+' · '+s.title,personalNotes[s.id].trim(),''])].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Notas_presentacion_San_Carlos.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);if(storeStatus)storeStatus.textContent='Descarga de notas preparada.';};
  const showDialog=dialog=>{if(!dialog)return;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');};
  const closeDialog=dialog=>{if(!dialog)return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');};
  const printPresentation=async button=>{if(printCleanup)return;button.disabled=true;notify(`Preparando ${slides.length} diapositivas…`);const stack=document.createElement('div');stack.className='sc-print-stack';stack.innerHTML=slides.map((s,i)=>`<div class="sc-print-slide">${renderSlide(s,i,slides.length,true)}</div>`).join('');document.body.appendChild(stack);let readinessTimer;
    const finish=()=>{document.body.classList.remove('sc-deck-printing');stack.remove();window.removeEventListener('afterprint',finish);button.disabled=false;printCleanup=null;notify('');clearTimeout(readinessTimer);};printCleanup=finish;
    const sources=[...new Set(slides.map(s=>asset(s.figure)).filter(Boolean).concat(['assets/media/00_mapa_portada_sin_rotulos.webp']))];
    await Promise.race([Promise.allSettled(sources.map(src=>{const image=new Image();image.src=src;return typeof image.decode==='function'?image.decode():Promise.resolve();})),new Promise(resolve=>{readinessTimer=setTimeout(resolve,5000);})]);clearTimeout(readinessTimer);if(disposed){finish();return;}document.body.classList.add('sc-deck-printing');window.addEventListener('afterprint',finish);try{window.print();}catch{finish();notify('No se pudo abrir la impresión. Usa la opción Imprimir del navegador.');}};
  listen(root,'click',event=>{const el=event.target instanceof Element?event.target:null;if(!el)return;
    if(el.closest('[data-deck-prev]'))navigate(active-1);
    else if(el.closest('[data-deck-next]'))navigate(active+1);
    else if(el.closest('[data-deck-index]'))focusAfterNavigation=true;
    else if(el.closest('[data-index-open]'))showDialog(root.querySelector('[data-index-dialog]'));
    else if(el.closest('[data-index-close]'))closeDialog(root.querySelector('[data-index-dialog]'));
    else if(el.closest('[data-deck-project]'))toggleProjection();
    else if(el.closest('[data-deck-notes-toggle]'))toggleNotes();
    else if(el.closest('[data-export-notes]'))exportNotes();
    else if(el.closest('[data-deck-print]'))printPresentation(el.closest('[data-deck-print]'));
    else if(el.closest('[data-deck-figure]'))showDialog(root.querySelector('[data-figure-dialog]'));
    else if(el.closest('[data-figure-close]'))closeDialog(root.querySelector('[data-figure-dialog]'));
    else if(el.closest('[data-figure-zoom]')){const n=Number(el.closest('[data-figure-zoom]').dataset.figureZoom);const image=root.querySelector('[data-zoom-image]');if(image){image.style.width=`${n*100}%`;image.style.maxWidth='none';}root.querySelectorAll('[data-figure-zoom]').forEach(b=>{const selected=Number(b.dataset.figureZoom)===n;b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));});}
    else if(el.closest('[data-figure-panel]')){const selected=el.closest('[data-figure-panel]').dataset.figurePanel;if((slide.imagePanels||[]).some(p=>p.id===selected)){panels.set(slide.id,selected);root.querySelector('.sc-stage').innerHTML=renderSlide(slide,active,slides.length);root.querySelector(`[data-figure-panel="${selected}"]`)?.focus({preventScroll:true});}}
    else if(el.closest('.sc-stage')&&!el.closest('button,a,input,textarea,select,summary'))root.querySelector('.sc-stage')?.focus({preventScroll:true});
  });
  if(field)listen(field,'input',saveNote);
  listen(document,'keydown',event=>{if(disposed||!root.isConnected||event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey)return;const target=event.target instanceof Element?event.target:document.activeElement;if(!projectionActive&&(!target||!root.contains(target)))return;if(target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')||root.querySelector('dialog[open]'))return;if(event.key===' '&&target?.closest('button,a,summary,[role="button"]'))return;if(event.key==='ArrowRight'||event.key==='PageDown'||event.key===' '){event.preventDefault();navigate(active+1);}else if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();navigate(active-1);}else if(event.key==='Home'){event.preventDefault();navigate(0);}else if(event.key==='End'){event.preventDefault();navigate(slides.length-1);}else if(event.key==='Escape'&&projectionActive&&!ownsNativeFullscreen){leaveProjection();updateProjection();}});
  listen(document,'fullscreenchange',()=>{if(ownsNativeFullscreen&&!document.fullscreenElement){ownsNativeFullscreen=false;projectionActive=false;document.documentElement.classList.remove('sc-deck-projecting');updateProjection();}});
  return()=>{disposed=true;disposers.forEach(f=>f());if(printCleanup)printCleanup();if(!/^#\/presentacion(?:\/|$)/.test(window.location.hash)){leaveProjection();notesVisible=false;focusAfterNavigation=false;}};
}
