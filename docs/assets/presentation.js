/* Presentación del taller. Datos editoriales en content/slides.json.
 * Los índices de la API son base cero; las rutas públicas son base uno.
 * Las notas personales se guardan únicamente en el navegador.
 */

let notesVisible = false;
let projectionActive = false;
let ownsNativeFullscreen = false;
let focusAfterNavigation = false;
let notesCache;
let notesStorageAvailable = true;
const NOTES_KEY = 'san-carlos-taller:presentacion:notas:v1';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const slideIndex = (slides, index) => Math.min(Math.max(0, Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0), Math.max(0, slides.length - 1));
const figurePath = slide => /^assets\/media\/[A-Za-z0-9_.-]+\.webp$/.test(slide.figure || '') ? slide.figure : '';
const route = index => `#/presentacion/${index + 1}`;

const STYLES = `
.sc-presenter{--sc-paper:#f5f2eb;--sc-ink:#17242c;--sc-green:#175e56;--sc-copper:#b1613e;--sc-line:#d9dfd9;color:var(--sc-ink);width:100%;margin:0 auto}
.sc-presenter *{box-sizing:border-box}
.sc-presenter button,.sc-presenter a{touch-action:manipulation}
.sc-presenter button{font:inherit;cursor:pointer}
.sc-presenter button:disabled{opacity:.4;cursor:default}
.sc-presenter button:focus-visible,.sc-presenter a:focus-visible,.sc-presenter summary:focus-visible,.sc-presenter textarea:focus-visible{outline:3px solid #b1613e;outline-offset:4px}
.sc-deck-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 16px}
.sc-deck-toolbar-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sc-deck-button{border:1px solid var(--sc-line);border-radius:5px;background:#fff;color:var(--sc-ink);padding:9px 13px;line-height:1.25;min-height:42px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:14px}
.sc-deck-button:hover:not(:disabled){background:#edf3ef;border-color:#769b92}
.sc-deck-button-primary{background:var(--sc-green);color:#fff;border-color:var(--sc-green)}
.sc-deck-button-primary:hover:not(:disabled){background:#104e47;color:#fff}
.sc-deck-counter{font-variant-numeric:tabular-nums;min-width:57px;text-align:center;font-size:14px}
.sc-deck-index{position:relative}
.sc-deck-index summary{list-style:none;cursor:pointer}
.sc-deck-index summary::-webkit-details-marker{display:none}
.sc-deck-index[open] summary{background:#e8f0ed}
.sc-deck-index-panel{position:absolute;z-index:40;right:0;top:calc(100% + 8px);width:min(480px,84vw);max-height:65vh;overflow:auto;border:1px solid var(--sc-line);border-radius:7px;box-shadow:0 10px 45px #17242c22;background:#fff;padding:12px}
.sc-deck-index-panel ol{list-style:none;margin:0;padding:0;display:grid;gap:3px}
.sc-deck-index-panel a{display:grid;grid-template-columns:28px minmax(0,1fr);gap:9px;text-decoration:none;color:var(--sc-ink);font-size:14px;padding:9px;border-radius:4px;line-height:1.35}
.sc-deck-index-panel a:hover,.sc-deck-index-panel a[aria-current=step]{background:#edf3ef;color:var(--sc-green)}
.sc-deck-index-number{font-variant-numeric:tabular-nums;color:#64776f}
.sc-stage{position:relative;border-radius:9px;overflow:hidden;box-shadow:0 12px 45px #17242c12;border:1px solid #d6ddd7;background:var(--sc-paper)}
.sc-slide{aspect-ratio:16/9;min-width:0;padding:clamp(20px,3.1vw,48px);display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:clamp(12px,1.5vw,22px);background:var(--sc-paper);color:var(--sc-ink);font-family:inherit;position:relative}
.sc-slide::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:var(--sc-green)}
.sc-slide-kicker{font-size:clamp(10px,1.05vw,14px);line-height:1.3;color:var(--sc-green);font-weight:600;letter-spacing:.065em;text-transform:uppercase;margin:0 0 10px}
.sc-slide h1,.sc-slide h2{font-size:clamp(23px,3vw,43px);line-height:1.12;font-weight:600;letter-spacing:-.025em;margin:0;max-width:1100px;color:var(--sc-ink)}
.sc-slide-body{font-size:clamp(15px,1.55vw,22px);line-height:1.45;margin:0;color:#40514f;max-width:1020px}
.sc-slide-content{display:flex;flex-direction:column;min-height:0;gap:clamp(12px,1.65vw,25px)}
.sc-slide-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,1.6vw,24px);flex:1}
.sc-slide-list li{font-size:clamp(17px,2vw,29px);line-height:1.35;display:grid;grid-template-columns:6px minmax(0,1fr);gap:clamp(12px,1.5vw,22px);align-items:start}
.sc-slide-list li::before{content:'';display:block;width:5px;height:1.05em;background:#b1613e;margin-top:.17em;border-radius:1px}
.sc-slide-footer{font-size:clamp(10px,1vw,13px);display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #d5ded5;padding-top:10px;color:#50645d;line-height:1.3;font-variant-numeric:tabular-nums}
.sc-slide-footer strong{font-weight:600;color:var(--sc-green)}
.sc-slide-figure{position:relative;flex:1;min-height:0;margin:0;display:flex;align-items:center;justify-content:center}
.sc-slide-figure img{display:block;max-width:100%;width:100%;height:100%;min-height:0;object-fit:contain}
.sc-slide-has-figure .sc-slide-content{gap:8px}
.sc-slide-has-figure .sc-slide-body{font-size:clamp(13px,1.2vw,17px);line-height:1.4}
.sc-slide-has-figure{gap:12px;padding-top:clamp(20px,2.7vw,38px);padding-bottom:16px}
.sc-slide-has-figure h1,.sc-slide-has-figure h2{font-size:clamp(22px,2.5vw,35px)}
.sc-deck-enlarge{position:absolute;bottom:4px;right:4px;background:#ffffffee;color:var(--sc-green);border:1px solid #bfd0c7;border-radius:4px;padding:7px 10px;font-size:12px;opacity:0;transition:opacity .15s}
.sc-slide-figure:hover .sc-deck-enlarge,.sc-deck-enlarge:focus-visible{opacity:1}
.sc-slide-practice{background:#eaf0ea}
.sc-slide-practice::before{background:var(--sc-copper)}
.sc-slide-practice .sc-slide-kicker{color:#8b4e32}
.sc-slide-practice .sc-slide-list{gap:18px}
.sc-slide-practice-link{font-size:clamp(13px,1.3vw,18px);color:#fff;background:var(--sc-green);display:inline-flex;gap:12px;align-items:center;padding:11px 18px;border-radius:4px;text-decoration:none;border:1px solid var(--sc-green);font-weight:600;white-space:nowrap}
.sc-slide-practice-link:hover{background:#104e47;color:#fff}
.sc-projector-controls{display:none}
.sc-deck-underbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;flex-wrap:wrap;color:#5e7069;font-size:13px}
.sc-deck-underbar p{margin:0}
.sc-deck-underbar kbd{font:inherit;padding:1px 5px;border:1px solid #d0d8d1;border-radius:3px;background:#fff}
.sc-deck-status{min-height:1.4em;color:#5a695f}
.sc-deck-notes{margin-top:22px;border:1px solid #cbd8d0;border-left:4px solid var(--sc-green);padding:clamp(18px,3vw,30px);border-radius:5px;background:#f7faf6;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr);gap:28px}
.sc-deck-notes[hidden]{display:none}
.sc-deck-notes h2{font-size:21px;line-height:1.3;margin:0 0 12px}
.sc-deck-notes p{font-size:15px;line-height:1.65;margin:0 0 14px}
.sc-deck-notes label{display:block;font-size:15px;font-weight:600;margin-bottom:9px}
.sc-deck-notes textarea{width:100%;min-height:160px;padding:12px;font:inherit;font-size:15px;line-height:1.55;color:var(--sc-ink);background:#fff;border:1px solid #afc2b6;border-radius:4px;resize:vertical}
.sc-deck-notes small{display:block;font-size:12px;line-height:1.45;color:#65776c;margin:8px 0 12px}
.sc-deck-note-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.sc-figure-dialog{width:min(1500px,96vw);max-width:96vw;max-height:96dvh;padding:16px;border:1px solid #bccbc0;border-radius:8px;background:#f5f2eb;color:var(--sc-ink);box-shadow:0 15px 70px #0004}
.sc-figure-dialog::backdrop{background:#10221be0}
.sc-figure-dialog-header{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:12px}
.sc-figure-dialog-header p{margin:0;font-size:16px;font-weight:600;line-height:1.4}
.sc-figure-dialog img{display:block;max-width:100%;width:100%;height:auto;max-height:calc(96dvh - 135px);object-fit:contain}
.sc-figure-dialog a{color:#175e56;font-size:13px;display:inline-block;margin-top:10px}
html.sc-deck-projecting{overflow:hidden!important}
html.sc-deck-projecting .sc-presenter{position:fixed;inset:0;z-index:2147483000;background:#15251f;display:flex;align-items:center;justify-content:center;padding:12px;width:100%;height:100dvh;max-width:none}
html.sc-deck-projecting .sc-deck-toolbar,html.sc-deck-projecting .sc-deck-underbar,html.sc-deck-projecting .sc-deck-notes{display:none!important}
html.sc-deck-projecting .sc-stage{width:min(calc(100vw - 24px),calc((100dvh - 24px)*16/9));max-height:calc(100dvh - 24px);border:0;border-radius:2px;box-shadow:none}
html.sc-deck-projecting .sc-slide{height:100%;max-height:calc(100dvh - 24px)}
html.sc-deck-projecting .sc-projector-controls{display:flex;position:absolute;right:12px;bottom:12px;gap:7px;align-items:center;background:#f5f2ebf5;padding:6px;border:1px solid #c7d4c9;border-radius:5px;opacity:0;transition:opacity .15s;z-index:6}
html.sc-deck-projecting .sc-stage:hover .sc-projector-controls,html.sc-deck-projecting .sc-projector-controls:focus-within{opacity:1}
html.sc-deck-projecting .sc-projector-controls .sc-deck-button{font-size:12px;min-height:34px;padding:6px 10px}
.sc-print-stack{display:none}
@media (hover:none){.sc-deck-enlarge{opacity:1}html.sc-deck-projecting .sc-projector-controls{opacity:1}}
@media (max-width:760px){.sc-slide{aspect-ratio:auto;min-height:440px;padding:22px;gap:18px}.sc-slide h1,.sc-slide h2{font-size:29px}.sc-slide-list li{font-size:21px}.sc-slide-body{font-size:17px}.sc-slide-has-figure{min-height:450px}.sc-slide-figure{min-height:220px}.sc-slide-figure img{height:auto;max-height:390px}.sc-slide-kicker{font-size:11px}.sc-slide-footer{font-size:11px}.sc-slide-practice-link{font-size:14px;padding:9px 12px}.sc-deck-notes{grid-template-columns:1fr}.sc-deck-index-panel{left:0;right:auto}.sc-deck-toolbar{align-items:flex-start}.sc-deck-toolbar-group{gap:6px}.sc-deck-button{font-size:13px;padding:8px 10px}.sc-slide-footer{flex-wrap:wrap}.sc-deck-enlarge{opacity:1}}
@media (max-height:560px) and (orientation:landscape){html.sc-deck-projecting .sc-slide{padding:16px;gap:8px;min-height:0}html.sc-deck-projecting .sc-slide h1{font-size:25px}html.sc-deck-projecting .sc-slide-list li{font-size:18px;gap:12px}html.sc-deck-projecting .sc-slide-kicker{font-size:9px;margin-bottom:5px}html.sc-deck-projecting .sc-slide-body{font-size:13px}html.sc-deck-projecting .sc-slide-footer{font-size:9px;padding-top:6px}html.sc-deck-projecting .sc-slide-figure{min-height:0}html.sc-deck-projecting .sc-slide-figure img{height:100%}html.sc-deck-projecting .sc-slide-practice-link{font-size:12px;padding:6px 9px}}
@media (prefers-reduced-motion:reduce){.sc-presenter *{transition:none!important;scroll-behavior:auto!important}}
@media print{
 @page{size:A4 landscape;margin:10mm}
 body.sc-deck-printing{background:white!important;margin:0!important;overflow:visible!important}
 body.sc-deck-printing > :not(.sc-print-stack){display:none!important}
 body.sc-deck-printing .sc-print-stack{display:block!important;color:#17242c;font-family:Arial,sans-serif}
 body.sc-deck-printing .sc-print-slide{display:block;break-after:page;page-break-after:always;break-inside:avoid;height:187mm;margin:0;padding:0}
 body.sc-deck-printing .sc-print-slide:last-child{break-after:auto;page-break-after:auto}
 body.sc-deck-printing .sc-slide{aspect-ratio:auto;height:185mm;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;padding:12mm;gap:6mm;box-sizing:border-box;border:1px solid #d6ddd7;background:#f5f2eb!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}
 body.sc-deck-printing .sc-slide h2{font-size:26pt;line-height:1.1}
 body.sc-deck-printing .sc-slide-kicker{font-size:9pt}
 body.sc-deck-printing .sc-slide-body{font-size:13pt;line-height:1.4}
 body.sc-deck-printing .sc-slide-list li{font-size:18pt;line-height:1.4}
 body.sc-deck-printing .sc-slide-list{gap:8mm}
 body.sc-deck-printing .sc-slide-content{min-height:0;gap:4mm}
 body.sc-deck-printing .sc-slide-figure{min-height:0}
 body.sc-deck-printing .sc-slide-figure img{max-height:100%;height:100%;width:100%;object-fit:contain}
 body.sc-deck-printing .sc-slide-footer{font-size:8pt;padding-top:3mm}
 body.sc-deck-printing .sc-slide-has-figure h2{font-size:23pt}
 body.sc-deck-printing .sc-slide-has-figure .sc-slide-body{font-size:11pt}
 body.sc-deck-printing .sc-slide-practice-link{font-size:11pt;padding:3mm;color:#175e56;background:transparent;border:1px solid #175e56}
 body.sc-deck-printing a::after{content:none!important}
}
`;

function renderSlide(slide, index, total, print = false) {
  const image = figurePath(slide);
  const practice = /^P0[1-6]$/.test(slide.practice || '') ? slide.practice : '';
  const heading = print ? 'h2' : 'h1';
  return `<article class="sc-slide${image ? ' sc-slide-has-figure' : ''}${practice ? ' sc-slide-practice' : ''}" aria-label="Diapositiva ${index + 1} de ${total}">
    <header><p class="sc-slide-kicker">${escapeHTML(slide.kicker)}</p><${heading}${print ? '' : ' tabindex="-1" data-slide-heading'}>${escapeHTML(slide.title)}</${heading}></header>
    <div class="sc-slide-content">
      ${slide.body ? `<p class="sc-slide-body">${escapeHTML(slide.body)}</p>` : ''}
      ${image ? `<figure class="sc-slide-figure"><img src="${image}" alt="${escapeHTML(slide.figureAlt || slide.title)}" decoding="async">${print ? '' : '<button type="button" class="sc-deck-enlarge" data-deck-figure aria-haspopup="dialog">Ampliar figura</button>'}</figure>` : ''}
      ${Array.isArray(slide.bullets) && slide.bullets.length ? `<ul class="sc-slide-list">${slide.bullets.map(text => `<li>${escapeHTML(text)}</li>`).join('')}</ul>` : ''}
    </div>
    <footer class="sc-slide-footer"><span>San Carlos · Sentinel-2 / IGN–SNIT</span>${practice ? `<a class="sc-slide-practice-link" href="#/practicas/${practice}">Abrir ${practice}<span aria-hidden="true">↗</span></a>` : `<span><strong>${index + 1}</strong> / ${total}</span>`}</footer>
  </article>`;
}

/** Renderiza la diapositiva index (base cero). slides es un array editorial. */
export function renderPresentation(slides, index = 0) {
  if (!Array.isArray(slides) || !slides.length) return '<section class="sc-presenter"><p role="status">La presentación no contiene diapositivas.</p></section>';
  const active = slideIndex(slides, index);
  const slide = slides[active];
  const image = figurePath(slide);
  return `<style data-presentation-style>${STYLES}</style>
  <section class="sc-presenter" aria-label="Presentación del taller San Carlos">
    <div class="sc-deck-toolbar">
      <div class="sc-deck-toolbar-group" role="group" aria-label="Navegar por la presentación">
        <a class="sc-deck-button" href="#/inicio">Volver al taller</a>
        <button type="button" class="sc-deck-button" data-deck-prev ${active === 0 ? 'disabled' : ''} aria-label="Diapositiva anterior">← Anterior</button>
        <span class="sc-deck-counter" aria-live="polite">${active + 1} / ${slides.length}</span>
        <button type="button" class="sc-deck-button" data-deck-next ${active === slides.length - 1 ? 'disabled' : ''} aria-label="Diapositiva siguiente">Siguiente →</button>
      </div>
      <div class="sc-deck-toolbar-group">
        <details class="sc-deck-index"><summary class="sc-deck-button">Índice de diapositivas</summary>
          <nav class="sc-deck-index-panel" aria-label="Índice de la presentación"><ol>${slides.map((item, position) => `<li><a href="${route(position)}" data-deck-index ${position === active ? 'aria-current="step"' : ''}><span class="sc-deck-index-number">${String(position + 1).padStart(2, '0')}</span><span>${escapeHTML(item.title)}</span></a></li>`).join('')}</ol></nav>
        </details>
        <button type="button" class="sc-deck-button" data-deck-notes-toggle aria-expanded="${notesVisible}" aria-controls="sc-speaker-notes">${notesVisible ? 'Ocultar notas' : 'Notas del ponente'}</button>
        <button type="button" class="sc-deck-button" data-deck-print>Imprimir presentación</button>
        <button type="button" class="sc-deck-button sc-deck-button-primary" data-deck-project>Pantalla completa</button>
      </div>
    </div>
    <div class="sc-stage">
      ${renderSlide(slide, active, slides.length)}
      <div class="sc-projector-controls" role="group" aria-label="Controles de proyección">
        <button type="button" class="sc-deck-button" data-deck-prev ${active === 0 ? 'disabled' : ''} aria-label="Diapositiva anterior">←</button>
        <span class="sc-deck-counter">${active + 1} / ${slides.length}</span>
        <button type="button" class="sc-deck-button" data-deck-next ${active === slides.length - 1 ? 'disabled' : ''} aria-label="Diapositiva siguiente">→</button>
        <button type="button" class="sc-deck-button" data-deck-project>Salir de proyección</button>
        <a class="sc-deck-button" href="#/inicio">Volver al taller</a>
      </div>
    </div>
    <div class="sc-deck-underbar"><p><kbd>←</kbd> <kbd>→</kbd> o <kbd>Espacio</kbd> para avanzar · ${escapeHTML(slide.minutes || 0)} min en esta diapositiva</p><p class="sc-deck-status" data-deck-status role="status" aria-live="polite"></p></div>
    <section class="sc-deck-notes" id="sc-speaker-notes" ${notesVisible ? '' : 'hidden'} aria-label="Notas del ponente">
      <div><h2>Notas del ponente · ${escapeHTML(slide.minutes || 0)} min</h2><p>${escapeHTML(slide.notes || '').replace(/\n\n/g, '</p><p>')}</p></div>
      <div><label for="sc-note-${escapeHTML(slide.id)}">Notas propias de esta diapositiva</label><textarea id="sc-note-${escapeHTML(slide.id)}" data-personal-note rows="7" placeholder="Ejemplos, preguntas o ajustes para tu sesión."></textarea><small data-note-storage role="status" aria-live="polite">Se guardan en este navegador. No se envían a un servidor.</small><div class="sc-deck-note-actions"><button type="button" class="sc-deck-button" data-export-notes>Descargar notas propias</button></div></div>
    </section>
    ${image ? `<dialog class="sc-figure-dialog" data-figure-dialog aria-labelledby="sc-figure-heading"><div class="sc-figure-dialog-header"><p id="sc-figure-heading">${escapeHTML(slide.title)}</p><button type="button" class="sc-deck-button" data-figure-close aria-label="Cerrar figura ampliada">Cerrar ✕</button></div><img src="${image}" alt="${escapeHTML(slide.figureAlt || slide.title)}" decoding="async"><a href="${image}" target="_blank" rel="noopener">Abrir imagen original en otra pestaña</a></dialog>` : ''}
  </section>`;
}

function readNotes() {
  if (notesCache) return notesCache;
  notesCache = {};
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) notesCache = parsed;
  } catch { notesStorageAvailable = false; }
  return notesCache;
}

function leaveProjection() {
  projectionActive = false;
  document.documentElement.classList.remove('sc-deck-projecting');
  if (ownsNativeFullscreen && document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    document.exitFullscreen().catch(() => {});
  }
  ownsNativeFullscreen = false;
}

/** Añade eventos al contenedor activo y devuelve la función de limpieza. */
export function bindPresentation(root, slides, index = 0) {
  if (!root || !Array.isArray(slides) || !slides.length) return () => {};
  const active = slideIndex(slides, index);
  const slide = slides[active];
  const cleanupTasks = [];
  const personalNotes = readNotes();
  const field = root.querySelector('[data-personal-note]');
  const storeStatus = root.querySelector('[data-note-storage]');
  const status = root.querySelector('[data-deck-status]');
  let disposed = false;
  let printCleanup = null;
  const listen = (element, type, handler, options) => {
    element.addEventListener(type, handler, options);
    cleanupTasks.push(() => element.removeEventListener(type, handler, options));
  };
  const notify = message => { if (status && !disposed) status.textContent = message; };

  if (field) field.value = typeof personalNotes[slide.id] === 'string' ? personalNotes[slide.id] : '';
  if (!notesStorageAvailable && storeStatus) storeStatus.textContent = 'Este navegador no permite guardar notas. Puedes escribirlas y descargarlas antes de salir.';
  if (focusAfterNavigation) {
    root.querySelector('[data-slide-heading]')?.focus({ preventScroll: true });
    focusAfterNavigation = false;
  }
  const updateProjectionControls = () => {
    root.querySelectorAll('[data-deck-project]').forEach(button => {
      button.textContent = projectionActive ? 'Salir de proyección' : (typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false ? 'Pantalla completa' : 'Vista de proyección');
      button.setAttribute('aria-pressed', String(projectionActive));
    });
  };
  updateProjectionControls();

  const navigate = target => {
    const next = slideIndex(slides, target);
    if (next === active) return;
    focusAfterNavigation = true;
    window.location.hash = route(next);
  };

  const toggleProjection = async () => {
    if (projectionActive) {
      leaveProjection();
      updateProjectionControls();
      return;
    }
    projectionActive = true;
    document.documentElement.classList.add('sc-deck-projecting');
    updateProjectionControls();
    if (!document.fullscreenElement && typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
      ownsNativeFullscreen = true;
      try {
        await document.documentElement.requestFullscreen();
        if (disposed && !/^#\/presentacion(?:\/|$)/.test(window.location.hash) && document.fullscreenElement === document.documentElement) {
          ownsNativeFullscreen = true;
          leaveProjection();
        }
      } catch {
        ownsNativeFullscreen = false;
        notify('Vista de proyección activada. El navegador no permitió ocultar sus controles.');
      }
    }
  };

  const toggleNotes = () => {
    notesVisible = !notesVisible;
    const notes = root.querySelector('#sc-speaker-notes');
    if (notes) notes.hidden = !notesVisible;
    root.querySelectorAll('[data-deck-notes-toggle]').forEach(button => {
      button.setAttribute('aria-expanded', String(notesVisible));
      button.textContent = notesVisible ? 'Ocultar notas' : 'Notas del ponente';
    });
  };

  const savePersonalNote = () => {
    if (!field) return;
    personalNotes[slide.id] = field.value;
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(personalNotes));
      notesStorageAvailable = true;
      if (storeStatus) storeStatus.textContent = 'Guardado en este navegador. No se envía a un servidor.';
    } catch {
      notesStorageAvailable = false;
      if (storeStatus) storeStatus.textContent = 'La nota sigue disponible durante esta sesión. Descárgala para conservarla.';
    }
  };

  const exportNotes = () => {
    const written = slides.filter(item => typeof personalNotes[item.id] === 'string' && personalNotes[item.id].trim());
    if (!written.length) { if (storeStatus) storeStatus.textContent = 'Escribe una nota antes de descargar.'; return; }
    const content = ['SAN CARLOS · NOTAS PROPIAS DE LA PRESENTACIÓN', '', ...written.flatMap(item => [item.id + ' · ' + item.title, personalNotes[item.id].trim(), ''])].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Notas_presentacion_San_Carlos.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    if (storeStatus) storeStatus.textContent = 'Descarga de notas preparada.';
  };

  const printPresentation = async button => {
    if (printCleanup) return;
    button.disabled = true;
    notify(`Preparando las ${slides.length} diapositivas para imprimir…`);
    const stack = document.createElement('div');
    stack.className = 'sc-print-stack';
    stack.innerHTML = slides.map((item, position) => `<div class="sc-print-slide">${renderSlide(item, position, slides.length, true)}</div>`).join('');
    document.body.appendChild(stack);
    const finish = () => {
      document.body.classList.remove('sc-deck-printing');
      stack.remove();
      window.removeEventListener('afterprint', finish);
      button.disabled = false;
      printCleanup = null;
      notify('');
    };
    printCleanup = finish;
    await Promise.race([
      Promise.allSettled([...stack.querySelectorAll('img')].map(image => typeof image.decode === 'function' ? image.decode() : Promise.resolve())),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    if (disposed) { finish(); return; }
    document.body.classList.add('sc-deck-printing');
    window.addEventListener('afterprint', finish);
    try { window.print(); } catch { finish(); notify('Usa la opción Imprimir de tu navegador.'); }
  };

  listen(root, 'click', event => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element) return;
    if (element.closest('[data-deck-prev]')) navigate(active - 1);
    else if (element.closest('[data-deck-next]')) navigate(active + 1);
    else if (element.closest('[data-deck-index]')) focusAfterNavigation = true;
    else if (element.closest('[data-deck-project]')) toggleProjection();
    else if (element.closest('[data-deck-notes-toggle]')) toggleNotes();
    else if (element.closest('[data-export-notes]')) exportNotes();
    else if (element.closest('[data-deck-print]')) printPresentation(element.closest('[data-deck-print]'));
    else if (element.closest('[data-deck-figure]')) {
      const dialog = root.querySelector('[data-figure-dialog]');
      if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
      else if (dialog) dialog.setAttribute('open', '');
    } else if (element.closest('[data-figure-close]')) {
      const dialog = root.querySelector('[data-figure-dialog]');
      if (dialog && typeof dialog.close === 'function') dialog.close();
      else if (dialog) dialog.removeAttribute('open');
    }
  });
  if (field) listen(field, 'input', savePersonalNote);

  listen(document, 'keydown', event => {
    if (disposed || !root.isConnected || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])') || root.querySelector('dialog[open]')) return;
    if (event.key === ' ' && target?.closest('button,a,summary,[role="button"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); navigate(active + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); navigate(active - 1); }
    else if (event.key === 'Home') { event.preventDefault(); navigate(0); }
    else if (event.key === 'End') { event.preventDefault(); navigate(slides.length - 1); }
    else if (event.key === 'Escape' && projectionActive && !ownsNativeFullscreen) { leaveProjection(); updateProjectionControls(); }
  });
  listen(document, 'fullscreenchange', () => {
    if (ownsNativeFullscreen && !document.fullscreenElement) {
      ownsNativeFullscreen = false;
      projectionActive = false;
      document.documentElement.classList.remove('sc-deck-projecting');
      updateProjectionControls();
    }
  });

  return () => {
    disposed = true;
    cleanupTasks.forEach(cleanup => cleanup());
    if (printCleanup) printCleanup();
    if (!/^#\/presentacion(?:\/|$)/.test(window.location.hash)) {
      leaveProjection();
      notesVisible = false;
      focusAfterNavigation = false;
    }
  };
}
