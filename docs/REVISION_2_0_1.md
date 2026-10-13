# Revisión de distribución y módulos — sitio v2.0.1

Fecha: 12 de octubre de 2026. La publicación del paquete v2.0.0 permanece íntegra.

## Correcciones

- P01 trabaja con el límite IGN del distrito 21007; el archivo entregado no acredita ni contiene la delimitación del área urbana del piloto municipal.
- P02 utiliza observaciones Sentinel-2 y sus máscaras, con QGIS/GDAL y los resultados CSV.
- P03 se realiza exclusivamente por demostración institucional. Los datos municipales de ArcGIS no forman parte del paquete distribuido; las fichas no constituyen aceptación técnica LoD2.2.
- P04 y P05 son mesas y acuerdos, no prácticas informáticas. Los contadores del sitio se expresan como «módulos».
- Se corrigen los textos de preparación y de mantenimiento que incluían «muestra LiDAR» como archivo público.
- Sitio y pruebas identifican versión 2.0.1; los enlaces de descarga se mantienen en el activo v2.0.0 con SHA-256 `fdce5a71a51b02a0b479967d3368c9d3d7f53fa62010bf2d2191e2eb5680fe74`.

## Condición de publicación

Verificar `npm run check`, revisión visual y acceso público antes de fusionar. La versión 2.0.1 corresponde al sitio; no implica publicar un ZIP distinto.
