import {esc,num,readLocal,setLocal,downloadText,copyText,icon,notify} from './shared.js';

document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const main=document.getElementById('contenido');
const cache=new Map();
const courses=['P01','P02','P03','P04','P05','P06'];
const thumbnails={P01:'01_portada_apaisada',P02:'S02_La_Fortuna',P03:'09_lectura_reflectancias',P04:'03_soporte_comun',P05:'04_cobertura_distrital',P06:'05_delta_ndvi'};
const labels={inicio:'Programa',preparacion:'Preparación',practicas:'Prácticas',atlas:'Atlas de San Carlos',expediente:'Mi trabajo',materiales:'Datos y materiales',docente:'Guía de facilitación',fuentes:'Fuentes y método',presentacion:'Presentación'};
const releaseUrl='https://github.com/apuitox04/san-carlos-taller/releases/tag/v1.0.2';
const prepChecks=[
 ['qgis','QGIS de escritorio está instalado','Utiliza el equipo y la versión con los que realizarás las prácticas.'],
 ['archivos','Los dos paquetes están extraídos juntos','Debe existir una sola carpeta Taller_San_Carlos con datos/ y proyectos/.'],
 ['proyecto','01_Practica.qgz abre con sus capas','Confirma que Canton_IGN, Distritos_IGN y Sitios_practica se muestran sin rutas perdidas.'],
 ['copia','Guardé mi copia de trabajo','Usa mi_trabajo/Practica_San_Carlos.qgz para guardar tus cambios.']
];
let state={course:null,practiceModule:null,page:'inicio',part:null,cleanup:null,serial:0};
let lastFocus,noticeTimer;

async function json(name){
 if(cache.has(name))return cache.get(name);
 const pending=(async()=>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(`content/${name}.json?v=1.3.0`,{signal:controller.signal});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json()}
  catch(error){cache.delete(name);throw new Error(`No se pudo cargar ${name}. ${error.name==='AbortError'?'La conexión tardó demasiado.':error.message}`)}
  finally{clearTimeout(timer)}
 })();cache.set(name,pending);pending.catch(()=>{if(cache.get(name)===pending)cache.delete(name)});return pending;
}
async function courseAndProgress(){
 const [course,module]=await Promise.all([json('course'),import('./practices.js?v=1.3.0')]);state.course=course;state.practiceModule=module;return {course,progress:module.getWorkshopProgress(course)};
}
function prepStatus(){const done=prepChecks.filter(([id])=>readLocal('sc-prep-'+id)==='1').length;return {done,total:prepChecks.length,ready:done===prepChecks.length}}
function progressState(){return state.course&&state.practiceModule?state.practiceModule.getWorkshopProgress(state.course):{total:6,reviewedCount:0,startedCount:0,nextPracticeId:'P01',items:[]}}
function activePractice(){const saved=readLocal('sc-last-practice'),last=courses.includes(saved)?saved:null,progress=progressState();return last&&!progress.items.find(p=>p.id===last)?.reviewed?last:progress.nextPracticeId||last||'P01'}
function pageHeader(kicker,title,desc,action=''){return `<header class="page-intro"><div><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1>${desc?`<p class="lead">${esc(desc)}</p>`:''}</div>${action}</header>`}
function miniProgress(progress){return `<div class="progress-strip" aria-label="Seguimiento personal"><div><span class="small muted">Prácticas revisadas por ti</span><strong>${progress.reviewedCount}<small> / ${progress.total}</small></strong></div><div class="progress-segments">${progress.items.map(p=>`<a href="#/practicas/${p.id}" class="${p.reviewed?'done':p.started?'started':''}" aria-label="${p.id}: ${p.reviewed?'revisada':p.started?'en curso':'pendiente'}"><span>${p.id}</span></a>`).join('')}</div><a class="text-link" href="#/expediente">Mi trabajo ${icon('arrow')}</a></div>`}
function practiceCards(course,progress,{compact=false}={}){return `<div class="practice-grid ${compact?'compact':''}">${course.practices.map(p=>{
 const record=progress.items.find(i=>i.id===p.id)||{};const started=record.started;const reviewed=record.reviewed;
 return `<a href="#/practicas/${p.id}" class="practice-card"><div class="practice-thumb"><img src="assets/media/${thumbnails[p.id]}.webp" alt="" loading="lazy"><span class="practice-code">${p.id}</span></div><div class="practice-card-body"><div class="practice-card-meta"><span class="status-dot ${reviewed?'complete':started?'active':''}">${reviewed?'Revisada':started?'En curso':'Por comenzar'}</span><span>${p.minutes} min</span></div><h2>${esc(p.title)}</h2><p>${esc(p.deliverable)}</p><div class="practice-card-action"><span>${started?'Continuar':'Abrir práctica'}</span>${icon('arrow')}</div>${record.completedTasks?`<small class="task-count">${record.completedTasks} / ${record.totalTasks} tareas marcadas</small>`:''}</div></a>`
 }).join('')}</div>`}
function municipalProgram(course, progress) {
  return `<ol class="municipal-program">${course.practices.map(p => {
    const record = progress.items.find(i => i.id === p.id) || {};
    const status = record.reviewed ? 'Revisada' : record.started ? 'En curso' : 'Abrir práctica';
    return `<li><span class="program-code">${p.id}</span><div class="program-description"><h3><a href="#/practicas/${p.id}">${esc(p.title)}</a></h3><p>${esc(p.deliverable)}</p></div><div class="program-access"><span>${p.minutes} min</span><a href="#/practicas/${p.id}" class="program-link">${status} ${icon('arrow')}</a></div></li>`;
  }).join('')}</ol>`;
}
function home(course, progress) {
  const next = course.practices.find(x => x.id === activePractice()) || course.practices[0];
  const primary = progress.startedCount ? `#/practicas/${next.id}` : '#/preparacion';
  const cta = progress.startedCount ? `Continuar ${next.id}` : 'Preparar el equipo';
  return `<div class="shell municipal-home">
    <header class="municipal-identity">
      <div class="institution-signature"><img src="assets/brand/escudo-municipal-oficial.png" alt="Escudo de la Municipalidad de San Carlos" width="58" height="60"><div><strong>Municipalidad de San Carlos</strong><span>Unidad de Catastro</span></div></div>
      <img class="canton-signature" src="assets/brand/marca-san-carlos-oficial.png" alt="Marca San Carlos, Costa Rica" width="100" height="85">
    </header>
    <section class="municipal-hero" aria-labelledby="workshop-title">
      <div class="municipal-hero-copy">
        <p class="workshop-label">Workshop <span>Gratuito</span></p>
        <h1 id="workshop-title">San Carlos<br><span>con datos abiertos</span></h1>
        <p class="workshop-subtitle">${esc(course.subtitle)}</p>
        <p class="workshop-description">Compare dos composiciones satelitales y obtenga resultados para los trece distritos de San Carlos. Revise la calidad de las observaciones, calcule indicadores y prepare un mapa con su informe.</p>
        <p class="workshop-audience">Dirigido a instituciones y público general.</p>
        <div class="workshop-actions"><a class="button" href="${primary}">${esc(cta)} ${icon('arrow')}</a><a class="button secondary" href="#/practicas">Abrir las prácticas ${icon('book')}</a></div>
      </div>
      <figure class="municipal-map"><img src="assets/media/00_mapa_portada_sin_rotulos.webp" alt="Mapa de San Carlos: límites distritales, relieve y observaciones de vegetación del caso de trabajo" width="640" height="600" fetchpriority="high"><figcaption><strong>Un caso de trabajo: todo San Carlos</strong><span>13 distritos · Límites oficiales IGN / Registro Nacional / SNIT</span></figcaption></figure>
    </section>
    <dl class="workshop-facts"><div><dt>Duración</dt><dd>Una jornada · 8 horas</dd></div><div><dt>Trabajo práctico</dt><dd>6 ejercicios en QGIS</dd></div><div><dt>Facilitación</dt><dd>Andrés Castillo Leitón<small>Ingeniero Topógrafo</small></dd></div></dl>
    ${progress.startedCount ? miniProgress(progress) : ''}
    <section class="workshop-resources" aria-label="Accesos del workshop">
      <a href="#/presentacion/1"><span class="resource-symbol">${icon('monitor')}</span><div><strong>Presentación</strong><span>30 diapositivas con notas y acceso a los ejercicios</span></div>${icon('arrow')}</a>
      <a href="#/materiales"><span class="resource-symbol">${icon('download')}</span><div><strong>Datos y práctica resuelta</strong><span>Proyectos QGIS, cuaderno y solucionario</span></div>${icon('arrow')}</a>
    </section>
    <section class="workshop-program-section"><div class="section-heading"><div><p class="eyebrow">Programa de trabajo</p><h2>De los datos al informe</h2></div><a class="text-link" href="#/docente">Agenda de la jornada ${icon('arrow')}</a></div><p class="program-intro">Cada ejercicio incluye las operaciones, el producto esperado y la resolución para comprobar el resultado.</p>${municipalProgram(course, progress)}</section>
    <section class="workshop-outcomes"><div><p class="eyebrow">Entrega de la jornada</p><h2>Un proyecto, una tabla distrital y un mapa documentado.</h2><p>El informe identifica las fechas de observación, la superficie comparable y las decisiones de cálculo. Las notas y respuestas se conservan en su expediente.</p><a class="text-link" href="#/expediente">Abrir mi trabajo ${icon('arrow')}</a></div><div class="workshop-source-note"><h3>Cartografía oficial y resultados verificables</h3><p>Los límites cantonales y distritales proceden del IGN, publicados mediante el SNIT. Las observaciones satelitales corresponden a Sentinel-2 de 2025.</p><a class="text-link" href="#/atlas">Consultar el atlas ${icon('arrow')}</a><a class="text-link" href="#/fuentes">Fuentes y método ${icon('arrow')}</a></div></section>
  </div>`;
}
function practiceOverview(course,progress){return `<div class="shell">${pageHeader('Ruta de trabajo','Prácticas guiadas','Abre una práctica, avanza por sus tareas y contrasta tus resultados. Puedes regresar a cualquier paso.',`<a class="button" href="#/practicas/${activePractice()}">${icon('play')}Continuar ${activePractice()}</a>`)}${miniProgress(progress)}<div class="inline-guidance">${icon('info')}<p>Los cálculos se realizan en QGIS de escritorio. Aquí tienes las instrucciones, las fórmulas, las comprobaciones y el registro de trabajo. <a href="#/preparacion">Preparar archivos</a></p></div>${practiceCards(course,progress)}</div>`}
function downloadTotal(settings){return num(settings.downloads.filter(f=>f.type==='ZIP').reduce((sum,f)=>sum+(Number(f.bytes)||0),0)/1000000,1)+' MB'}
function downloadCard(f,{required=false,index=0}={}){return `<article class="download-card ${required?'required':''}"><div class="download-card-top"><span class="download-symbol">${icon(required?'layers':'file')}</span><span class="pill">${esc(f.type)} · ${esc(f.size)}</span></div>${required?`<p class="eyebrow">Paquete ${index+1} de 2</p>`:''}<h3>${esc(f.title)}</h3><p>${esc(f.description)}</p><a class="button ${required?'':'secondary'}" href="${esc(f.url)}" download>${icon('download')}Descargar ${esc(f.type)}</a>${f.sha256?`<details class="checksum"><summary>Verificar SHA-256</summary><code>${esc(f.sha256)}</code></details>`:''}</article>`}
function preparation(settings){
 const prep=prepStatus();const zips=settings.downloads.filter(x=>x.type==='ZIP');
 return `<div class="shell setup-shell">${pageHeader('Antes de P01','Preparar el equipo y los archivos','Completa estos tres pasos en la computadora que utilizarás durante el taller.')}<div class="device-note">${icon('monitor')}<div><strong>QGIS se utiliza en computadora.</strong><span>Desde el teléfono puedes consultar el taller y registrar notas. Instala QGIS y extrae los paquetes en la computadora donde harás los cálculos.</span><a class="text-link" href="https://qgis.org/download/" target="_blank" rel="noopener">Descarga oficial de QGIS ${icon('external')}</a></div></div>
 <section class="setup-section"><div class="setup-heading"><span>01</span><div><h2>Descargar los dos paquetes</h2><p>Son complementarios. En total: ${downloadTotal(settings)} comprimidos.</p></div></div><div class="downloads-grid two">${zips.map((f,i)=>downloadCard(f,{required:true,index:i})).join('')}</div></section>
 <section class="setup-section"><div class="setup-heading"><span>02</span><div><h2>Extraer y abrir el proyecto</h2><p>Conserva las carpetas y sus rutas relativas.</p></div></div><div class="setup-instructions"><ol class="setup-steps"><li><strong>Extrae ambos ZIP en la misma ubicación.</strong><p>Debe quedar una sola carpeta <code>Taller_San_Carlos</code>. Si cada ZIP quedó en una carpeta independiente, reúne sus contenidos antes de abrir QGIS.</p></li><li><strong>Abre la guía de inicio.</strong><p>Dentro de esa carpeta encontrarás <code>EMPEZAR.html</code>, los datos y los proyectos.</p></li><li><strong>Abre el proyecto de práctica en QGIS.</strong><div class="path-copy"><code>proyectos/01_Practica.qgz</code><button class="icon-button" data-copy-path="proyectos/01_Practica.qgz" aria-label="Copiar ruta del proyecto">${icon('copy')}</button></div></li><li><strong>Guarda tu copia de trabajo.</strong><div class="path-copy"><code>mi_trabajo/Practica_San_Carlos.qgz</code><button class="icon-button" data-copy-path="mi_trabajo/Practica_San_Carlos.qgz" aria-label="Copiar ruta de la copia de trabajo">${icon('copy')}</button></div></li></ol><div class="folder-guide"><span class="folder-guide-title">La carpeta que debes tener</span><div>${icon('folder')}<strong>Taller_San_Carlos</strong></div><ul><li>${icon('layers')}<code>datos/</code><span>Límites y observaciones</span></li><li>${icon('folder')}<code>proyectos/</code><span>Práctica y resolución</span></li><li>${icon('file')}<code>EMPEZAR.html</code><span>Instrucciones de apertura</span></li><li>${icon('folder')}<code>mi_trabajo/</code><span>Tus resultados</span></li></ul></div></div></section>
 <section class="setup-section"><div class="setup-heading"><span>03</span><div><h2>Comprobar la preparación</h2><p>Marca cada condición después de comprobarla en tu equipo.</p></div></div><div class="readiness-panel"><div class="readiness-list">${prepChecks.map(([id,title,help])=>`<label><input type="checkbox" data-prep="${id}" ${readLocal('sc-prep-'+id)==='1'?'checked':''}><span><strong>${esc(title)}</strong><small>${esc(help)}</small></span></label>`).join('')}</div><div class="readiness-action"><span id="prep-count">${prep.done} / ${prep.total}</span><strong id="prep-label">${prep.ready?'Preparación revisada':'Comprobaciones registradas'}</strong><p id="prep-status" role="status">Tus marcas se guardan en este navegador.</p><a class="button" href="#/practicas/P01">Comenzar P01 ${icon('arrow')}</a></div></div></section>
 <details class="help-panel"><summary>${icon('help')}El proyecto muestra capas perdidas</summary><p>Comprueba primero que <code>datos/</code> y <code>proyectos/</code> pertenezcan a la misma carpeta <code>Taller_San_Carlos</code>. Vuelve a abrir <code>01_Practica.qgz</code> desde esa ubicación. Evita abrir el proyecto directamente dentro del ZIP.</p></details><p class="source-line">Consulta <a href="#/materiales">Materiales</a> para descargar el cuaderno, el solucionario y la guía sin conexión.</p></div>`;
}
function bindPreparation(){
 const listeners=[];main.querySelectorAll('[data-prep]').forEach(input=>{const change=()=>{const ok=setLocal('sc-prep-'+input.dataset.prep,input.checked?'1':'0');const prep=prepStatus();main.querySelector('#prep-count').textContent=`${prep.done} / ${prep.total}`;main.querySelector('#prep-label').textContent=prep.ready?'Preparación revisada':'Comprobaciones registradas';main.querySelector('#prep-status').textContent=ok?'Tus marcas se guardan en este navegador.':'Las marcas se conservan mientras esta página permanezca abierta. El navegador bloquea el guardado entre sesiones.';updateShell()};input.addEventListener('change',change);listeners.push(()=>input.removeEventListener('change',change))});
 return ()=>listeners.forEach(fn=>fn());
}
function materials(settings){return `<div class="shell">${pageHeader('Descargas','Materiales de trabajo','Materiales gratuitos de la Unidad de Catastro. El cuaderno y el solucionario también pueden consultarse sin conexión.',`<a class="button" href="#/preparacion">${icon('settings')}Preparar archivos</a>`)}<section><div class="section-heading"><div><h2>Para trabajar en QGIS</h2><p class="muted">Descarga los dos paquetes y extráelos juntos.</p></div><span class="pill">${downloadTotal(settings)} en total</span></div><div class="downloads-grid two">${settings.downloads.filter(f=>f.type==='ZIP').map((f,i)=>downloadCard(f,{required:true,index:i})).join('')}</div></section><section class="section-space"><div class="section-heading"><div><h2>Cuadernos y resolución</h2><p class="muted">Documentación para estudiar, consultar o imprimir.</p></div></div><div class="downloads-grid">${settings.downloads.filter(f=>f.type!=='ZIP').map(f=>downloadCard(f)).join('')}</div></section><div class="material-end"><div><strong>Los resultados resueltos están incluidos.</strong><p>Abre <code>proyectos/02_Practica_resuelta.qgz</code> para contrastar los cálculos, las tablas y el mapa. La web conserva las mismas cifras de referencia.</p></div><a class="text-link" href="${esc(settings.releaseUrl)}" target="_blank" rel="noopener">Publicación y huellas ${icon('external')}</a></div></div>`}
function presentationLobby(slides){return `<div class="shell">${pageHeader('Unidad de Catastro · Municipalidad de San Carlos','Presentación del workshop','San Carlos con datos abiertos. Treinta diapositivas con cartografía, operaciones y prácticas para la jornada municipal.',`<a class="button" href="#/presentacion/1">${icon('play')}Abrir presentación</a>`)}<section class="present-intro"><div><span class="eyebrow">Workshop gratuito</span><h2>San Carlos<br>con datos abiertos.</h2><p>Proyecta las diapositivas, consulta las notas del ponente y abre la práctica correspondiente desde cada bloque.</p><div class="actions"><a class="button" href="#/presentacion/1">Comenzar en la diapositiva 1 ${icon('arrow')}</a><a class="text-link" href="#/docente">Agenda y ensayo</a></div></div><img src="assets/media/00_mapa_portada_sin_rotulos.webp" alt="San Carlos, ámbito completo del taller"></section><div class="section-heading section-space"><h2>Elegir un punto de inicio</h2><span class="small muted">30 diapositivas</span></div><div class="slide-index-grid">${slides.map((s,i)=>`<a href="#/presentacion/${i+1}" class="slide-index-card"><span>${String(i+1).padStart(2,'0')}</span><div><small>${esc(s.kicker||s.section||'Taller San Carlos')}</small><strong>${esc(s.title)}</strong></div>${icon('arrow')}</a>`).join('')}</div></div>`}

function updateShell(){
 const progress=progressState(),prep=prepStatus();
 document.querySelector('#sidebar-progress-label').textContent=state.course?`${progress.reviewedCount} de ${progress.total} prácticas revisadas`:'Abre Prácticas para consultar tu avance';
 document.querySelector('#sidebar-progress-fill').style.width=`${progress.reviewedCount/progress.total*100}%`;
 document.querySelector('#sidebar-prep-count').textContent=`${prep.done}/${prep.total}`;
 const resume=document.getElementById('resume-work');resume.href=`#/practicas/${activePractice()}`;resume.querySelector('[data-resume-label]').textContent=`Continuar ${activePractice()}`;
 document.querySelectorAll('[data-nav]').forEach(link=>{const selected=link.dataset.nav===state.page;selected?link.setAttribute('aria-current','page'):link.removeAttribute('aria-current')});
 document.querySelector('#current-section').textContent=state.page==='practicas'&&state.part?`${state.part} · Práctica guiada`:labels[state.page]||'Taller';
}
function closeMenu({restore=true}={}){
 const opened=document.body.classList.contains('menu-open');document.body.classList.remove('menu-open');document.getElementById('main-navigation').removeAttribute('aria-modal');document.getElementById('main-navigation').removeAttribute('role');document.getElementById('workspace').inert=false;document.getElementById('mobile-navigation').inert=false;document.getElementById('menu-toggle').setAttribute('aria-expanded','false');if(opened&&restore)lastFocus?.focus();
}
function openMenu(){lastFocus=document.activeElement;document.body.classList.add('menu-open');const sidebar=document.getElementById('main-navigation');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('role','dialog');document.getElementById('workspace').inert=true;document.getElementById('mobile-navigation').inert=true;document.getElementById('menu-toggle').setAttribute('aria-expanded','true');document.getElementById('close-menu').focus()}
function bindMainUtilities(){main.querySelectorAll('[data-copy-path]').forEach(button=>button.addEventListener('click',async()=>{if(await copyText(button.dataset.copyPath)){notify('Ruta copiada.')}else{const code=button.parentElement.querySelector('code');const range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);notify('Selecciona y copia la ruta resaltada.')}}))}
async function route(){
 const hash=location.hash.replace(/^#\/?/,'')||'inicio';if(hash==='contenido'){main.focus();return}
 const [page,part]=hash.split('/');const serial=++state.serial;state.cleanup?.();state.cleanup=null;state.page=page;state.part=part;closeMenu({restore:false});
 const projecting=page==='presentacion'&&Boolean(part);document.body.classList.toggle('presenting',projecting);document.body.dataset.page=page;updateShell();main.setAttribute('aria-busy','true');main.innerHTML='<div class="section-loading" role="status"><span></span>Cargando la sección…</div>';
 try{
  let html,bind;
  if(page==='inicio'||page==='practicas'&&!part){const {course,progress}=await courseAndProgress();html=page==='inicio'?home(course,progress):practiceOverview(course,progress)}
  else if(page==='preparacion'){html=preparation(await json('settings'));bind=bindPreparation}
  else if(page==='materiales')html=materials(await json('settings'));
  else if(page==='practicas'||page==='expediente'){
   const [{course},solutions,formulas]=await Promise.all([courseAndProgress(),json('solutions'),json('formulas')]);const module=state.practiceModule;
   if(page==='expediente'){html=`<div class="shell wide">${module.renderPortfolio(course,solutions,formulas)}</div>`;bind=()=>module.bindPortfolio(main,course,solutions,formulas)}
   else{const id=courses.includes(part)?part:'P01';state.part=id;setLocal('sc-last-practice',id);html=`<div class="shell wide practice-shell">${module.renderPractice(course,solutions,formulas,id)}</div>`;bind=()=>module.bindPractice(main,course,solutions,formulas,id)}
  }else if(page==='atlas'){
   const [territory,stats,sites,module]=await Promise.all([json('territorio'),json('estadisticas'),json('sitios'),import('./atlas.js?v=1.3.0')]);html=`<div class="shell wide atlas-shell">${module.renderAtlas(territory,stats,sites)}</div>`;bind=()=>module.bindAtlas(main,territory,stats,sites)
  }else if(page==='presentacion'){
   const slides=await json('slides');if(!part)html=presentationLobby(slides);else{const module=await import('./presentation.js?v=1.3.0');const index=Math.max(0,Math.min(slides.length-1,(parseInt(part,10)||1)-1));html=module.renderPresentation(slides,index);bind=()=>module.bindPresentation(main,slides,index)}
  }else if(page==='docente'||page==='fuentes'){
   const module=await import('./reference.js?v=1.3.0');if(page==='docente'){html=module.renderTeacher({});bind=()=>module.bindTeacher(main)}else html=module.renderSources({territory:await json('territorio')})
  }else html=`<div class="shell"><div class="error-box">${icon('map')}<h1>Esta sección no existe</h1><p>Abre el índice para elegir una práctica o consultar los materiales.</p><a class="button" href="#/inicio">Volver al inicio ${icon('arrow')}</a></div></div>`;
  if(serial!==state.serial)return;main.innerHTML=html;state.cleanup=bind?.()||null;bindMainUtilities();updateShell();document.title=`${labels[page]||'Taller'}${state.part&&page==='practicas'?' '+state.part:''} · San Carlos`;window.scrollTo({top:0,behavior:'instant'});main.removeAttribute('aria-busy');if(!projecting)main.focus({preventScroll:true});
 }catch(error){if(serial!==state.serial)return;document.body.classList.remove('presenting');main.removeAttribute('aria-busy');main.innerHTML=`<div class="shell"><section class="error-box">${icon('info')}<h1>No se pudo cargar esta sección</h1><p>Vuelve a intentarlo. Puedes seguir utilizando las otras secciones o descargar los archivos desde GitHub.</p><p class="small muted">${esc(error.message)}</p><div class="actions"><button id="retry-section" class="button">Volver a intentar</button><a class="button secondary" href="${releaseUrl}">Descargar materiales</a></div></section></div>`;main.querySelector('#retry-section').addEventListener('click',route);console.error(error)}
}

const searchDialog=document.getElementById('search-dialog');let searchItems=null,searchOp=0;
async function openSearch(){
 if(!searchDialog.showModal){location.hash='#/practicas';return}
 searchDialog.showModal();const input=document.getElementById('search-input');input.value='';input.focus();document.getElementById('search-results').innerHTML='<p class="muted">Cargando el índice…</p>';
 try{if(!searchItems){const [course,slides]=await Promise.all([json('course'),json('slides')]);searchItems=[...course.practices.map(p=>({kind:`Práctica ${p.id}`,title:p.title,text:p.question+' '+p.inputs.join(' ')+' '+p.sections.map(s=>s.title+' '+s.blocks.map(b=>b.text||b.items?.join(' ')||'').join(' ')).join(' '),url:`#/practicas/${p.id}`})),...slides.map((s,i)=>({kind:`Diapositiva ${i+1}`,title:s.title,text:[s.body,s.notes,...(s.bullets||[])].join(' '),url:`#/presentacion/${i+1}`})),{kind:'Preparación',title:'Descargar datos y abrir el proyecto QGIS',text:'archivos zip extracción capas perdidas rutas',url:'#/preparacion'},{kind:'Mi trabajo',title:'Notas, respuestas e informe',text:'expediente exportar importar restaurar s06',url:'#/expediente'},{kind:'Atlas',title:'Cobertura y resultados de los trece distritos',text:'ndvi mndwi umbral fechas tabla csv',url:'#/atlas'}]};renderSearch(input.value)}catch{document.getElementById('search-results').innerHTML='<p>No se pudo cargar el índice. Abre <a href="#/practicas" data-search-link>Prácticas</a> para continuar.</p>';bindSearchLinks()}
}
const normalize=text=>String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function renderSearch(query){const terms=normalize(query).trim().split(/\s+/).filter(Boolean);const results=(searchItems||[]).filter(item=>terms.every(word=>normalize(item.title+' '+item.kind+' '+item.text).includes(word))).slice(0,12);document.getElementById('search-count').textContent=terms.length?`${results.length}${results.length===12?'+':''} resultados`:'Prácticas y accesos';document.getElementById('search-results').innerHTML=results.length?results.map(r=>`<a href="${r.url}" class="search-result" data-search-link><span>${esc(r.kind)}</span><strong>${esc(r.title)}</strong>${icon('arrow')}</a>`).join(''):'<p class="search-empty">No hay coincidencias. Prueba con una práctica, un índice o una operación.</p>';bindSearchLinks()}
function bindSearchLinks(){searchDialog.querySelectorAll('[data-search-link]').forEach(link=>link.addEventListener('click',()=>searchDialog.close()))}
document.getElementById('search-input').addEventListener('input',event=>{clearTimeout(searchOp);searchOp=setTimeout(()=>renderSearch(event.target.value),100)});
document.querySelectorAll('[data-open-search]').forEach(b=>b.addEventListener('click',openSearch));document.getElementById('close-search').addEventListener('click',()=>searchDialog.close());searchDialog.addEventListener('click',event=>{if(event.target===searchDialog)searchDialog.close()});
document.getElementById('menu-toggle').addEventListener('click',openMenu);document.getElementById('close-menu').addEventListener('click',()=>closeMenu());document.getElementById('drawer-scrim').addEventListener('click',()=>closeMenu());
document.getElementById('skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView?.({block:'start'})});
document.addEventListener('keydown',event=>{
 if(document.body.classList.contains('menu-open')){
  if(event.key==='Escape'){event.preventDefault();closeMenu();return}
  if(event.key==='Tab'){const focusable=[...document.getElementById('main-navigation').querySelectorAll('a,button')].filter(x=>!x.disabled);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}return;
 }
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch()}
});
window.addEventListener('sc-progress-change',()=>updateShell());window.addEventListener('sc-notice',event=>{const box=document.getElementById('notice');clearTimeout(noticeTimer);box.textContent=event.detail;box.classList.add('visible');noticeTimer=setTimeout(()=>box.classList.remove('visible'),5000)});
window.addEventListener('hashchange',route);window.addEventListener('resize',()=>{if(window.innerWidth>900&&document.body.classList.contains('menu-open'))closeMenu({restore:false})});route();courseAndProgress().then(updateShell).catch(()=>{});
