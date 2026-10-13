import assert from "node:assert/strict";
import {existsSync, readFileSync, readdirSync, statSync} from "node:fs";
import {dirname, extname, join, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "docs");
const readText = path => readFileSync(path, "utf8");
const readJson = path => JSON.parse(readText(path));
const packageInfo = readJson(join(root, "package.json"));
const course = readJson(join(web, "content", "course.json"));
const indexPath = join(web, "index.html");
const index = readText(indexPath);
const appCss = readText(join(web, "assets", "app.css"));
const appJs = readText(join(web, "assets", "app.js"));

assert.equal(packageInfo.version, "3.0.0");
assert.equal(packageInfo.license, "MIT");
assert.equal(course.meta.version, packageInfo.version);
assert.equal(course.meta.durationMinutes, 240);
assert.equal(course.schedule.reduce((sum, item) => sum + item.minutes, 0), 240);
assert.deepEqual(course.modules.map(item => item.id), ["P01", "P02", "P03", "P04", "P05", "P06"]);
assert.deepEqual(course.tables.map(item => item.id), ["M1", "M2", "M3", "M4", "M5"]);
assert.equal(course.outcomes.length, 5);
assert.equal(course.project.crs.includes("EPSG:8908"), true);
assert.equal(course.project.online.length, 2);
assert.ok(course.project.status.some(item => item.includes("LoD2.2")));
assert.ok(course.purpose.includes("distrito 21007"));
assert.ok(course.sources.some(item=>item.url.includes("plTools")));
assert.ok(course.modules.some(item=>item.steps.join(" ").includes("plMapcalc")));
assert.ok(course.schedule.every(item=>item.minutes>0));

for (const item of [...course.schedule, ...course.modules, ...course.tables]) {
  assert.ok(item.title || item.name, "Cada elemento tiene título o nombre");
}
for (const module of course.modules) {
  assert.equal(module.steps.length, 4, `${module.id}: cuatro pasos`);
  assert.ok(module.question.endsWith("?"), `${module.id}: pregunta explícita`);
  assert.ok(module.evidence, `${module.id}: evidencia`);
}

for (const id of ["inicio", "territorio", "proyecto", "ruta", "practicas", "mesas", "facilitacion", "materiales", "fuentes"]) {
  assert.ok(index.includes(`id="${id}"`), `Sección #${id}`);
  assert.ok(index.includes(`href="#${id}"`), `Navegación #${id}`);
}
assert.equal((index.match(/<h1\b/g) || []).length, 1);
assert.ok(index.includes("?v=2.0.1"));
assert.ok(index.includes("no cuenta con acreditación, aval o patrocinio"));
assert.ok(!/trece distritos|13 distritos|ocho horas|8 horas/i.test(index));
assert.ok(!/trece distritos|13 distritos|ocho horas|8 horas/i.test(JSON.stringify(course)));
assert.ok(appCss.includes("--blue: #14416e"));
assert.ok(appCss.includes("@media print"));
assert.ok(appJs.includes("localStorage"));
assert.ok(appJs.includes("download-notes"));

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "IDs HTML únicos");

const localReferences = [];
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const value = match[1];
  if (/^(?:https?:|#|mailto:|data:)/i.test(value)) continue;
  const clean = value.split(/[?#]/)[0];
  const path = join(web, clean);
  assert.ok(existsSync(path), `Falta referencia local: ${value}`);
  localReferences.push(value);
}
for (const item of course.resources) {
  if (/^https?:/i.test(item.url)) continue;
  assert.ok(existsSync(join(web, item.url)), `Falta recurso: ${item.url}`);
}

const externalUrls = [
  ...course.project.online.map(item => item.url),
  ...course.resources.filter(item => /^https?:/i.test(item.url)).map(item => item.url),
  ...course.sources.map(item => item.url)
];
for (const url of externalUrls) assert.equal(new URL(url).protocol, "https:");
assert.equal(new Set(externalUrls).size, externalUrls.length, "Enlaces externos sin duplicados");

const matrixHeader = readText(join(web, "recursos", "matriz-acuerdos.csv")).split(/\r?\n/)[0];
assert.equal(matrixHeader, "mesa,pregunta,capa,custodio,validador,frecuencia,acceso,control_calidad,siguiente_accion,responsable,plazo,evidencia_cierre");
const observationHeader = readText(join(web, "recursos", "ficha-observacion.csv")).split(/\r?\n/)[0];
assert.equal(observationHeader, "id,fecha,persona,entidad,capa,ubicacion,tipo_observacion,descripcion,evidencia,estado,responsable,fecha_revision");

assert.ok(existsSync(join(root, "LICENSE")));
assert.ok(readText(join(root, "LICENSE")).startsWith("MIT License"));
assert.ok(readText(join(web, "LICENCIAS_Y_DATOS.md")).includes("CC BY 4.0"));
assert.ok(readText(join(web, "assets", "brand", "PROCEDENCIA.md")).includes("Libro de Marca"));

const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(web);
for (const path of files.filter(path => extname(path) === ".js")) {
  execFileSync(process.execPath, ["--check", path], {stdio: "pipe"});
}
for (const image of ["arcgis-pro-cobertura.png", "arcgis-pro-revision.png", "arcgis-pro-lod22.png"]) {
  const path = join(web, "assets", "media", image);
  assert.ok(existsSync(path), `Falta imagen: ${image}`);
  assert.ok(statSync(path).size > 100_000, `Imagen incompleta: ${image}`);
}

console.log([
  "Sitio 3.0.0 verificado:",
  "240 minutos,",
  "5 módulos,",
  "5 mesas,",
  `${course.outcomes.length} productos,`,
  `${localReferences.length} referencias HTML locales y`,
  `${files.length} archivos en ${relative(root, web)}.`
].join(" "));
console.log("La comprobación valida estructura, sintaxis y rutas locales; la revisión visual y los enlaces de red se prueban por separado.");
