const volatile = new Map();
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = (value,places=2) => value == null ? 'Sin dato' : new Intl.NumberFormat('es-CR',{minimumFractionDigits:places,maximumFractionDigits:places}).format(value);
export function readLocal(key){if(volatile.has(key))return volatile.get(key);try{return localStorage.getItem(key)}catch{return null}}
export function setLocal(key,value){volatile.set(key,String(value));try{localStorage.setItem(key,String(value));return true}catch{return false}}
export function notify(message){window.dispatchEvent(new CustomEvent('sc-notice',{detail:String(message)}))}
export function downloadText(name,text,mime='text/plain;charset=utf-8'){
 try{const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);return true}
 catch{notify('El navegador no pudo iniciar la descarga. Prueba a abrir el sitio en una pestaña de Safari, Chrome o Firefox.');return false}
}
export async function copyText(value){try{await navigator.clipboard.writeText(value);return true}catch{return false}}
const paths={
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 layers:'<path d="m3 7 9-4 9 4-9 4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/>',
 book:'<path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 folder:'<path d="M3 5h6l2 3h10v12H3Z"/>',
 monitor:'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M7 21h10"/>',
 play:'<path d="m9 5 11 7-11 7Z"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 external:'<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 settings:'<path d="M5 4v16M12 4v16M19 4v16M2 8h6M9 16h6M16 9h6"/>',
 file:'<path d="M5 2h9l5 5v15H5Z"/><path d="M14 2v6h5M8 12h8M8 16h8"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3M12 17v1"/>'
};
export const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.file}</svg>`;
