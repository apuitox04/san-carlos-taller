# San Carlos · Laboratorio de análisis territorial con software libre

Workshop gratuito impartido por la Unidad de Catastro de la Municipalidad de San Carlos. Se propone el Ecocampus de la UTN como sede, sin fecha ni coorganización confirmadas.

## Enfoque

Los tres talleres que sirven de núcleo son GDAL, plMapcalc y Jupyter/Python. QGIS permite estudiar los productos. Flower y computación cuántica se reservaron como extensiones de MLSpAnFOSS 2026 y no se ejecutan en la jornada.

La base aportada contiene 75.442 huellas IGN, 80.584 Microsoft, 145.611 Google y 126.868 Overture. Son registros de catálogos distintos, no edificaciones únicas. La geometría distrital tiene 13 códigos y EPSG:8908; sin metadatos de procedencia para certificar equivalencia con la DTA oficial. Cotejar con el servicio WFS del IGN/SNIT antes de usar estadísticas institucionales.

## Actividades

P01: revisar geometría y área de los 13 distritos. Quesada tiene 27.888 registros Google sobre 143,7409 km², Cutris 11.654 sobre 849,3837 km².

P02: inspeccionar la cuadrícula de 250 m mediante GDAL; crear VRT y COG; verificar CRS y NoData.

P03: operar con plMapcalc: D = abs(G - M)/(G + M + 1), usando rásteres Google y Microsoft; comprobar el resultado con la referencia NumPy.

P04: Jupyter/Python: aplicar log(1+n), estandarizar cuatro fuentes y ejecutar KMeans con tres grupos para las celdas con registros; no clasificar uso legal del suelo.

P05: comparar intensidades por distrito, analizar omisiones de catálogo y justificar incertidumbre.

P06: entregar proyecto QGIS, cuadro, mapa y nota técnica.

## Resultados del ejercicio ejecutado

53.606 celdas de 250 m dentro del cantón rasterizado; 145.404 centroides Google y 80.478 Microsoft en esa máscara. KMeans: 39.688 celdas sin registro en los cuatro catálogos, 6.693 de clase baja, 4.848 intermedia y 2.377 alta.

## Condiciones

Los catálogos no establecen cambios temporales por sí solos. El análisis de vegetación, agua, relieve y cambio requiere otras fuentes fechadas. La práctica plMapcalc debe probarse con plTools instalado en las computadoras del taller. El cuaderno equivalente en NumPy sí se ejecutó y verificó.

## Referencias

MLSpAnFOSS: https://www.mlspanfoss.org/workshops
GDAL: https://gdal.org/programs/index.html
plTools: https://gitlist.host417505.xce.pl/plTools
IGN/SNIT: https://www.snitcr.go.cr/servicios_ogc_completo
UTN: https://www.utn.ac.cr/content/sede-regional-san-carlos

Este taller no tiene aval ni organización de MLSpAnFOSS, IEEE, OSGeo o UTN.
