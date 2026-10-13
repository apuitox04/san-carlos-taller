# Fuentes y operaciones verificables

| Paisaje o producto | Fuente mínima | Herramienta | Salida | Límite |
|---|---|---|---|---|
| Distrito La Fortuna | IGN/SNIT 21007 | QGIS/GDAL | Polígono EPSG:8908 | Diferente del piloto urbano |
| Parque Nacional Volcán Arenal | SINAC/plan manejo y polígono oficial por obtener | QGIS, plForestFragment (opcional) | Ámbito protegido con cobertura validada | NDVI no sustituye mapa forestal |
| Lago Arenal y red hídrica | Composiciones Sentinel-2 + polígono y serie oficial pendientes | plMapcalc/GDAL, QGIS | MNDWI y lista de control | MNDWI no define la ribera legal |
| Asentamientos | Sentinel-2 + huellas urbanas autorizadas | GDAL, QGIS | Candidatos y revisión | NDBI no prueba edificación |
| Agricultura y ganadería | Sentinel-2 + fuentes MAG/INTA/INDER | GDAL, QGIS | Variación de índices | NDVI no discrimina cultivos |
| Relieve, laderas y drenaje | DEM/DTM oficial pendiente | GDAL, QGIS | Diseño de análisis y metadatos | Sin DEM no se calculan pendientes |
| Fragmentación y segmentación | Máscara forestal o categórica validada | plForestFragment/plGeoJSEG | Estadística/segmentos contrastados | Extensión no ejecutada en paquete original |

**Bandas:** 1=B03 verde; 2=B04 rojo; 3=B08 infrarrojo cercano; 4=B11 infrarrojo de onda corta. Los archivos son composiciones L2A de 2025 con fecha registrada por píxel.

**Fórmulas:**
- NDVI = (B08 − B04) / (B08 + B04)
- MNDWI = (B03 − B11) / (B03 + B11)
- NDBI = (B11 − B08) / (B11 + B08)

**Máscaras y denominador:** únicamente píxeles del distrito con calidad aceptada, bandas finitas, reflectancias positivas y coherentes y denominador no nulo. Comparación de fechas solo sobre soporte común. Píxel = 20 × 20 m = 0,04 ha. Las superficies calculadas son equivalentes de **píxeles aceptados**, no polígonos oficiales.

**Umbrales didácticos, sin validación de campo:**
- agua candidata: MNDWI > 0,20 y NDVI < 0,15;
- vegetación vigorosa: NDVI ≥ 0,65;
- suelo/superficie expuesta: NDBI > 0,10 y NDVI < 0,30.
Cambiar el umbral exige reportar sensibilidad y evaluación independiente antes de concluir sobre superficie.

## Fuentes primarias y repositorios
- MLSpAnFOSS: https://www.mlspanfoss.org/workshops
- plTools: https://gitlist.host417505.xce.pl/plTools
- SNIT: https://www.snitcr.go.cr/
- Parque Nacional Volcán Arenal: https://www.sinac.go.cr/ES/ac/ACAHN/pnva/Paginas/default.aspx
- Arenal Tempisque/embalse: https://www.sinac.go.cr/ES/ac/acat/Paginas/default.aspx
- Copernicus Sentinel-2: https://dataspace.copernicus.eu/
- GDAL: https://gdal.org/
- QGIS: https://qgis.org/

Estas referencias permiten localizar fuentes y herramientas, pero no significan que las capas oficiales mencionadas se hayan recibido.
