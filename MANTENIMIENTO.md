# Mantenimiento del taller

## Archivos que se editan

Las rutas siguientes corresponden a GitHub. En la copia de ChatGPT Sites, el directorio equivalente a `docs/` es `dist/`.

| Archivo | Responsabilidad |
| --- | --- |
| `docs/index.html` | Metadatos, navegación, pie y estructura inicial. |
| `docs/assets/app.js` | Inicio, atlas, materiales, ponente, fuentes y enrutamiento. |
| `docs/assets/app.css` | Diseño general, atlas, adaptación móvil e impresión. |
| `docs/assets/practices.js` | Prácticas, comprobaciones, expediente, fórmulas y exportaciones. |
| `docs/assets/practices.css` | Presentación de las prácticas. |
| `docs/assets/presentation.js` | Diapositivas, proyección, notas e impresión. |
| `docs/content/course.json` | Programa y desarrollo de P01–P06. |
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

Conservar las interfaces de los módulos: `renderPractice` y `bindPractice` para prácticas, `renderPresentation` y `bindPresentation` para diapositivas. El índice interno de presentación comienza en cero; las direcciones visibles comienzan en uno. Al abandonar una sección, ejecutar su función de limpieza para retirar listeners y cerrar el modo de proyección.

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

La aplicación conserva notas y progreso en `localStorage`. La versión actual no importa expedientes de otras personas ni recibe entregas en un servidor. Los archivos TXT y JSON exportados son copias del trabajo del participante; su conservación depende de quien los descarga. Al añadir campos en el futuro, mantener las claves existentes o implementar una migración para no perder notas anteriores.
