import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve, dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, existsSync(join(root, 'docs/index.html')) ? 'docs' : 'dist');
const read = name => JSON.parse(readFileSync(join(web, 'content', name + '.json'), 'utf8'));
const packageInfo = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const data = Object.fromEntries(['course', 'solutions', 'formulas', 'slides', 'territorio', 'sitios', 'estadisticas', 'settings', 'plataformas'].map(name => [name, read(name)]));

assert.ok(existsSync(join(web, 'index.html')));
assert.ok(existsSync(join(web, '.nojekyll')));
assert.equal(packageInfo.version, data.settings.webVersion);
assert.equal(packageInfo.license, 'UNLICENSED');
assert.ok(readFileSync(join(web, 'index.html'), 'utf8').includes(`?v=${data.settings.webVersion}`));
assert.deepEqual(data.course.practices.map(x => x.id), ['P01', 'P02', 'P03', 'P04', 'P05', 'P06']);
assert.equal(data.course.practices.reduce((sum, x) => sum + x.minutes, 0), 370);
assert.equal(data.slides.length, 30);
assert.equal(data.slides.reduce((sum, x) => sum + x.minutes, 0), 390);
assert.equal(data.formulas.items.length, 11);
let taskCount = 0;
for (const practice of data.course.practices) {
  const tasks = practice.workflow.tasks;
  assert.equal(practice.workflow.version, 2);
  assert.equal(new Set(tasks.map(t => t.id)).size, tasks.length, `Tareas únicas: ${practice.id}`);
  const solvedSections = [...data.solutions.introduction, ...data.solutions.practices.flatMap(p => p.sections)];
  const seenChecks = new Set();
  for (const task of tasks) {
    assert.ok(task.title && task.goal && task.outputPaths.length, `Tarea operativa: ${practice.id}/${task.id}`);
    for (const ref of [...task.sourceRefs, ...task.conceptRefs, ...task.verificationRefs]) {
      const section = [...practice.sections, ...data.course.introduction].find(s => s.id === ref.sectionId);
      const block = section?.blocks[ref.blockIndex];
      assert.ok(block, `Bloque: ${practice.id}/${task.id}/${ref.sectionId}`);
      for (const index of ref.itemIndices || []) assert.ok(block.items?.[index], `Operación: ${task.id}/${index}`);
    }
    for (const id of task.checkIds) {
      assert.ok(practice.checks.some(c => c.id === id), `Control: ${task.id}/${id}`);
      seenChecks.add(id);
    }
    for (const id of task.formulaIds) assert.ok(data.formulas.items.some(f => f.id === id), `Fórmula: ${task.id}/${id}`);
    for (const id of task.solutionSectionIds) assert.ok(solvedSections.some(s => s.id === id), `Solución: ${task.id}/${id}`);
    for (const id of task.figureKeys) assert.ok(practice.figures.some(f => f.file === id), `Figura: ${task.id}/${id}`);
  }
  assert.deepEqual([...seenChecks].sort(), practice.checks.map(c => c.id).sort(), `Controles presentes en el recorrido de ${practice.id}`);
  taskCount += tasks.length;
}
assert.equal(taskCount, 28);
assert.deepEqual(data.territorio.districts.map(x => x.code), Array.from({length:13}, (_, i) => 21001 + i));
assert.equal(data.territorio.crs, 'EPSG:8908');
assert.equal(data.territorio.northUp, true);
assert.equal(data.estadisticas.coverage.gridCells, 8380093);
assert.equal(data.estadisticas.coverage.commonCells, 4979989);
assert.equal(data.territorio.districts.reduce((sum, x) => sum + x.commonCells, 0), data.estadisticas.coverage.commonCells);
assert.equal(data.estadisticas.datePairs.length, 6);
assert.equal(data.settings.downloads.length, 5);
for (const item of data.settings.downloads) {
  assert.equal(new URL(item.url).protocol, 'https:');
  assert.ok(item.url.endsWith('/' + item.file), `Nombre de descarga: ${item.file}`);
  assert.ok(item.url.startsWith('https://github.com/apuitox04/san-carlos-taller/releases/download/v' + data.settings.version + '/'));
  if (item.type === 'ZIP') assert.match(item.sha256, /^[0-9a-f]{64}$/);
}

assert.ok(existsSync(join(web, 'assets/options.js')));
assert.deepEqual(data.plataformas.routes.map(x => x.id), ['libre', 'comercial', 'hibrida']);
assert.deepEqual(data.plataformas.practiceEquivalences.map(x => x.practice), ['P01', 'P02', 'P03', 'P04', 'P05', 'P06']);
for (const route of data.plataformas.routes) {
  assert.ok(route.label && route.cost && route.summary && route.condition, `Ruta completa: ${route.id}`);
  assert.ok(route.components.length >= 5, `Capacidades de la ruta: ${route.id}`);
}
for (const item of data.plataformas.practiceEquivalences) {
  assert.ok(item.open && item.commercial && item.output, `Equivalencia completa: ${item.practice}`);
}
for (const source of data.plataformas.sources) assert.equal(new URL(source.url).protocol, 'https:');
assert.deepEqual(data.plataformas.relatedProjects.map(x => x.url), [
  'https://github.com/users/apuitox04/projects/1',
  'https://github.com/apuitox04/catastro-gestion-geoespacial'
]);

let references = 0;
const checkValue = value => {
  if (Array.isArray(value)) return value.forEach(checkValue);
  if (value && typeof value === 'object') return Object.values(value).forEach(checkValue);
  if (typeof value === 'string' && /^assets\/[\w./-]+$/.test(value)) {
    assert.ok(existsSync(join(web, value)), `Falta referencia: ${value}`);
    references++;
  }
};
Object.values(data).forEach(checkValue);
const files = walk(web);
for (const path of files.filter(x => x.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', path], {stdio:'pipe'});
}
const imageCount = files.filter(x => x.endsWith('.webp')).length;
assert.equal(imageCount, 18);
assert.ok(existsSync(join(web, 'assets/fonts/OFL.txt')));
assert.ok(existsSync(join(web, 'assets/fonts/IBMPlexSans-Variable.woff')));
console.log(`Integridad verificada: ${relative(root, web)}/, ${files.length} archivos, 6 prácticas, ${taskCount} tareas, 30 diapositivas, 3 rutas de software, 13 distritos, ${imageCount} figuras, ${references} referencias locales y 5 descargas declaradas.`);
console.log('Esta comprobación no realiza solicitudes de red ni sustituye la revisión visual o el ensayo de cada ruta con los datos municipales.');
