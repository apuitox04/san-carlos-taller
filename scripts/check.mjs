import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve, dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, existsSync(join(root, 'docs/index.html')) ? 'docs' : 'dist');
const read = name => JSON.parse(readFileSync(join(web, 'content', name + '.json'), 'utf8'));
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const data = Object.fromEntries(['course', 'solutions', 'formulas', 'slides', 'territorio', 'sitios', 'estadisticas', 'settings'].map(name => [name, read(name)]));

assert.ok(existsSync(join(web, 'index.html')));
assert.ok(existsSync(join(web, '.nojekyll')));
assert.deepEqual(data.course.practices.map(x => x.id), ['P01', 'P02', 'P03', 'P04', 'P05', 'P06']);
assert.equal(data.course.practices.reduce((sum, x) => sum + x.minutes, 0), 370);
assert.equal(data.slides.length, 30);
assert.equal(data.formulas.items.length, 11);
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
console.log(`Integridad verificada: ${relative(root, web)}/, ${files.length} archivos, 6 prácticas, 30 diapositivas, 13 distritos, ${imageCount} figuras, ${references} referencias locales y 5 descargas declaradas.`);
console.log('Esta comprobación no realiza solicitudes de red ni sustituye la revisión visual o el ensayo en QGIS.');
