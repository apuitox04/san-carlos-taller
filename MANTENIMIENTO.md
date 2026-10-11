# Mantenimiento del taller

## Archivos que se editan

Las rutas siguientes corresponden a GitHub. En la copia de ChatGPT Sites, el directorio equivalente a `docs/` es `dist/`.

| Archivo | Responsabilidad |
| --- | --- |
| `docs/index.html` | Metadatos, navegación, pie y estructura inicial. |
| `docs/assets/app.js` | Enrutamiento, inicio, preparación, descargas, índice de presentación, búsqueda y navegación. |
| `docs/assets/app.css` | Estructura general, páginas de acceso, adaptación móvil e impresión. |
| `docs/assets/municipal.css` | Museo Sans, colores institucionales, portada, programa y ajustes de identidad. |
| `docs/assets/brand/` | Escudo, marca cantonal, franja, fuentes y registros de procedencia. |
| `docs/assets/shared.js` | Iconos, texto seguro, almacenamiento, copia y descarga. |
| `docs/assets/reference.js` | Fuentes, agenda, ensayo del ponente y su exportación. |
| `docs/assets/atlas.js` y `atlas.css` | Mapa, inspector, selección, tablas, CSV, sitios y ampliación de láminas. |
| `docs/assets/practices.js` | Prácticas, comprobaciones, expediente, fórmulas y exportaciones. |
| `docs/assets/practices.css` | Presentación de las prácticas. |
| `docs/assets/presentation.js` y `presentation.css` | Composiciones de diapositivas, proyección, notas e impresión. |
| `docs/content/course.json` | Programa, desarrollo original y recorridos `workflow.tasks` de P01–P06. |
| `docs/content/solutions.json` | Desarrollo de las soluciones. |
| `docs/content/formulas.json` | Fórmulas originales para QGIS. |
| `docs/content/slides.json` | Diapositivas, figuras y notas del ponente. |
| `docs/content/territorio.json` | Geometría de visualización y resultados de los 13 distritos. |
| `docs/content/estadisticas.json` | Coberturas, fechas y sensibilidad de umbrales. |
| `docs/content/sitios.json` | Sitios de control y valores resueltos. |
| `docs/content/settings.json` | Versión, autor, repositorio, descargas y huellas SHA-256. |
| `docs/assets/media/manifest.json` | Relación entre las figuras originales y sus copias web. |

## Correcciones de texto o diseño

Editar los archivos correspondientes, ejecutar `npm run check` y revisar en el navegador la sección modificada. Las rutas usan fragmentos como `#/practicas/P01`; esto permite enlazar una sección sin configurar redirecciones de servidor.

Conservar las interfaces de los módulos:

- Prácticas: `renderPractice`, `bindPractice` y `getWorkshopProgress`.
- Mi trabajo: `renderPortfolio` y `bindPortfolio`.
- Atlas: `renderAtlas` y `bindAtlas`.
- Presentación: `renderPresentation` y `bindPresentation`.

Cada función `bind` devuelve una función de limpieza. El enrutador la ejecuta al abandonar la sección. El índice interno de presentación comienza en cero y las direcciones visibles comienzan en uno. El módulo de prácticas emite `sc-progress-change` al guardar; la navegación actualiza el avance sin volver a dibujar los campos de escritura.

Las tareas referencian bloques originales, fórmulas, controles, soluciones y figuras por identificador. Revisar esas relaciones cuando cambie el recorrido. Los cambios de presentación o navegación pueden tener una versión web propia, sin reemplazar los activos de datos de una publicación anterior. Los recursos de la edición web 1.3.0 usan `?v=1.3.0`; actualizar ese identificador al publicar una revisión para evitar mezclar archivos almacenados en caché.

No modificar los resultados numéricos para ajustar una frase. Una revisión del método o de los datos requiere recalcular el material fuente, comprobar sus salidas y publicar una nueva edición.

## Publicar una nueva edición

1. Preparar y comprobar los paquetes fuera del repositorio web. Conservar las fuentes, el sistema de coordenadas, las fechas de adquisición, el método y los resultados de control.
2. Crear una publicación nueva en GitHub, con una etiqueta nueva y sus activos. Evitar reemplazar silenciosamente los ZIP de una edición ya entregada.
3. Actualizar `settings.json` con los nombres, tamaños, direcciones y SHA-256 reales de los archivos publicados.
4. Actualizar la edición en el pie, los textos afectados, las diapositivas y el README. La fecha del material y la fecha de una convocatoria son campos distintos.
5. Ejecutar `npm run check`, revisar las secciones modificadas y comprobar las descargas. Los controles numéricos del script corresponden a la edición 1.0.0; una edición con datos diferentes debe documentar y actualizar sus valores de referencia.
6. Subir los cambios a `main`. GitHub Pages publica el contenido de `/docs`. Comprobar el resultado del despliegue en GitHub antes de distribuir el enlace.

## Regenerar las figuras web y el atlas

La preparación de imágenes y geometrías es opcional. No hace falta ejecutarla para cambiar textos o utilizar el sitio. `scripts/prepare_assets.py` toma los materiales originales extraídos de ambos ZIP y genera las copias web; no vuelve a analizar las observaciones ráster.

Dependencias de esa preparación: Python, Pillow, Fiona, Shapely 2.1 o posterior y fontTools. La fuente original y su licencia ya están incluidas.

```sh
python scripts/prepare_assets.py --materiales /ruta/Taller_San_Carlos --dist docs
```

El script verifica la huella del GeoPackage de límites de esta edición antes de preparar el SVG. La simplificación es para pantalla; no se utiliza para calcular superficies. Una nueva fuente oficial exige una revisión explícita del método y de las comprobaciones.

## Datos locales del navegador

La aplicación conserva notas y progreso en `localStorage`. Las claves de las prácticas mantienen el prefijo `san-carlos-taller:practica:v1:`. El formato interno añade tarea activa, tareas revisadas y notas por tarea; la lectura migra los registros anteriores sin eliminar sus campos originales. La preparación, el atlas y las notas de presentación utilizan claves independientes.

Mi trabajo exporta JSON 2.0 y admite JSON 1.0 y 2.0 del taller. Antes de restaurar valida el archivo y presenta los registros afectados. Solo los reemplaza al pulsar el botón de confirmación; cancelar conserva el estado actual. `course.legacyTitles` conserva el título de las exportaciones anteriores; mantenerlo al cambiar el nombre público. La importación de un expediente no modifica la preparación del equipo ni los datos geográficos. El sitio no recibe entregas en un servidor. Al añadir campos, mantener las claves existentes o implementar una migración para no perder registros.

## Identificación institucional

El taller es gratuito, impartido por la Unidad de Catastro de la Municipalidad de San Carlos y dirigido a instituciones y público general. Andrés Castillo Leitón figura como facilitador. Conservar esta identificación en portada, presentación, cuadernos, proyectos QGIS y publicaciones de materiales. Las fechas de convocatoria, la sede y el procedimiento de inscripción solo se incorporan cuando se hayan definido.

La edición 1.0.2 aplica el título «San Carlos con datos abiertos» y el diseño del libro de marca publicado por la Municipalidad. Conservar colores, proporciones y procedencia de sus activos. No aplicar filtros, sombras, deformaciones ni recoloraciones al escudo o a la marca cantonal. Los mapas mantienen sus escalas cromáticas analíticas.

El ZIP de materiales cambia por la revisión de documentos, mapas, proyectos y notas editoriales. El ZIP de datos es idéntico al activo 1.0.1. Los archivos geográficos, las observaciones satelitales, los cálculos y los resultados conservan la edición analítica 1.0.0. Una revisión editorial no representa un nuevo ensayo de los cálculos o de QGIS.
