# Detección de construcciones con IA | San Carlos

**Edición de propuesta técnica, 14/10/2026.** Organiza: Unidad de Catastro de la Municipalidad de San Carlos. **Participación gratuita.** Sede propuesta, no confirmada: Ecocampus UTN (La Abundancia, Ciudad Quesada).

Sitio: abrir \`index.html\`. El recurso forma parte del repositorio \`apuitox04/san-carlos-taller\`; no modifica el taller independiente de La Fortuna situado en la raíz.

## Datos y alcance

La tabla cantonal se calculó del ZIP aportado para la revisión: 75.442 huellas IGN 2017, 80.584 Microsoft, 145.611 Google Open Buildings v3 y 126.868 Overture. No se suman las cuatro fuentes. La asignación distrital procede del atributo del paquete municipal y debe recalcularse para una versión institucional sobre la DTA oficial IGN/SNIT.

Muestra resuelta de Quesada: 1 km², Google 2.093 y Microsoft 1.201. Google vs Microsoft con mejor IoU ≥ 0,35: 886 huellas con concordancia, 1.207 sin concordancia suficiente. Las detecciones con fuente distinta no acreditan cambios en el tiempo.

El ejemplo multitemporal utiliza escenas sintéticas, no imágenes reales del cantón. Para trabajar sobre edificaciones reales son imprescindibles dos imágenes de alta resolución fechadas, alineadas y con controles independientes.

## Operación de la web

- Presentación: botón de la portada; flechas para avanzar/retroceder y Escape para salir.
- Laboratorio: selección del umbral de IoU y comprobación conceptual.
- Explorador: selección de los 13 distritos y exportación CSV.
- Materiales: ficha de inspección editable y enlaces de fuentes.

La práctica QGIS resuelta y su GeoPackage para Quesada se entregan como archivo ZIP separado en el entorno de trabajo. No se redistribuyen en este repositorio las capas íntegras de IGN/SNIT ni de Overture. Para datos IGN consultar los términos vigentes del SNIT; Overture Buildings se publica bajo ODbL 1.0; Google Open Buildings bajo CC BY 4.0 y Microsoft bajo CDLA Permissive 2.0.

## Fuente institucional

UTN: https://www.utn.ac.cr/content/sede-regional-san-carlos

DTA IGN / SNIT: https://www.snitcr.go.cr/servicios_ogc_completo

Google: https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons

Microsoft: https://github.com/microsoft/GlobalMLBuildingFootprints

Overture: https://docs.overturemaps.org/guides/buildings/
