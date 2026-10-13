# Facilitación | La Fortuna: laboratorio de análisis territorial

## Alcance y resultados
Sesión municipal gratuita de 240 minutos para instituciones y público general. Se analiza el **distrito 21007 completo**, no solo el piloto cartográfico urbano. Los paisajes de contraste son Parque Nacional Volcán Arenal, lago Arenal, centro urbano, agricultura/ganadería, hidrografía/relieve y accesibilidad.

Cada grupo entrega proyecto QGIS, mapas, indicador CSV con denominador, ficha de hallazgos y matriz de información institucional. El taller **no certifica usos, derechos, daños o límites de protección**.

## Datos disponibles y precisión de la evidencia
- Límite IGN/SNIT de La Fortuna, en GeoPackage EPSG:8908.
- Composiciones Sentinel-2 L2A de 2025, con bandas B03/B04/B08/B11, fecha del píxel y control SCL, en cuadrícula de 20 m.
- Superficie representada por la cuadrícula distrital: **22.957,84 ha**; soporte común de ambas composiciones: **6.699,88 ha** (29,18 %).
- El paquete v2.0.0 tiene NDVI y sitios de estudio. El complemento distrital v3.0 prepara MNDWI, NDBI y firma espectral exploratoria, con máscaras.
- **No** están incorporados al paquete base los polígonos oficiales del parque, del lago, del área urbana, los cultivos, la red vial o el DEM. La consulta a las entidades pertinentes es parte del resultado, no algo que deba suplirse dibujando límites hipotéticos.

## Software y atribución
- **GDAL**: procesamiento de ráster y reproducibilidad. Es la ruta de ejecución garantizada cuando sus dependencias están disponibles.
- **plMapcalc / plTools**: álgebra ráster inspirada en el taller de Paweł Netzel y Jacek Ślopek de MLSpAnFOSS 2026. Probar instalación y comandos antes de la sesión; también puede demostrarse el flujo documentado sin ejecutar binarios no verificados.
- **QGIS**: lectura de capas, QA, composición cartográfica y exportación.
- **plForestFragment y plGeoJSEG**: extensiones optativas para máscara forestal *validada* y categorías comprobadas. Una capa NDVI≥0,65 no demuestra que exista bosque.
- **Jupyter/Python**: reproducción y evaluación de indicadores, cuando haya equipos disponibles.
No existe patrocinio ni acreditación de MLSpAnFOSS para este taller municipal. Los materiales originales mantienen sus propias licencias.

## Agenda, cronómetro desde el inicio
| Minutos | Trabajo | Evidencia |
|---:|---|---|
| 00–15 | Preguntas territoriales, limitaciones | Selección de paisaje |
| 15–40 | P01 IGN/SNIT, CRS, calidad y fuentes | Proyecto y ficha |
| 40–80 | P02 GDAL/plMapcalc, MNDWI | Mapa de agua candidata |
| 80–120 | P03 NDVI, soporte común, paisaje | Mapa y límites |
| 120–130 | Pausa y respaldo | Archivos guardados |
| 130–170 | P04 NDBI, firmas, agricultura/urbano | Mapa de candidatos |
| 170–200 | P05 DEM, drenaje, vías y restricciones: fuentes requeridas | Inventario de vacíos |
| 200–230 | P06 Mesas por paisaje | Matriz de validación |
| 230–240 | Entrega | CSV, mapa, QGIS, acuerdos |

## Preguntas por mesa
1. **SINAC / parque:** identificar la capa oficial, la cobertura temporal y los requisitos para interpretar vegetación y fragmentación.
2. **ICE / lago:** separar la respuesta espectral de agua del límite oficial del embalse, sus cotas y temporalidad.
3. **Municipalidad / área urbana:** relacionar cambios candidatos con huellas, permisos, acceso y red vial, sin presumir construcción ilegal.
4. **MAG–INTA–INDER / producción:** no confundir cultivo, pastura, reforestación y bosque; solicitar muestras de referencia y ciclos productivos.
5. **CNE / MOPT / servicios:** priorizar DEM, amenazas, redes, activos y observaciones necesarias para analizar continuidad.

## Recepción
Rechazar entregas que: cuenten NoData como ausencia; interpreten MNDWI como límite del embalse; atribuyan NDVI alto exclusivamente a bosque; infieran uso urbano solo con NDBI; mezclen escenas con fechas distintas sin declarar sus límites; atribuyan derechos o prohibiciones a una operación GIS.

Cada ficha exige: pregunta, fuente y fecha, unidad, denominador, evidencia, incertidumbre, responsable de validación y acción documentada. 
