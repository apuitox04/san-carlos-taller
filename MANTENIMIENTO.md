# Mantenimiento de la edición 2.0.1

## Regla de edición

La rama `main` contiene una sola edición vigente. No se crean carpetas por fecha ni copias como “final”, “final2” o “corregida”.

## Contenido

Editar `docs/content/course.json` para cambiar:

- agenda;
- prácticas;
- mesas;
- estado municipal;
- enlaces;
- preparación;
- productos;
- fuentes.

La agenda suma 240 minutos. Los módulos P01–P02 se realizan con el paquete QGIS, P03 es demostración restringida y P04–P05 son mesas y acuerdos. Las mesas se identifican M1–M5.

## Diseño

- `docs/index.html`: orden de lectura y estructura accesible.
- `docs/assets/app.css`: identidad municipal y adaptación a pantalla o impresión.
- `docs/assets/app.js`: carga de contenido, avance y notas locales.
- `docs/assets/brand/`: activos institucionales con procedencia documentada.
- `docs/assets/media/`: capturas vigentes que sustentan el estado del proyecto.

No modificar proporciones, color o composición de las marcas oficiales.

## Materiales

Las plantillas pequeñas se conservan en `docs/recursos/`. El paquete de datos y proyecto QGIS se publica como activo de la etiqueta `v2.0.0`.

Nombre canónico:

`Taller_La_Fortuna_Datos_y_Proyecto.zip`

Antes de reemplazarlo:

1. abrir el proyecto QGIS;
2. comprobar rutas relativas;
3. confirmar EPSG:8908;
4. revisar GeoPackage, ráster y CSV; el paquete v2.0.0 no contiene LiDAR municipal;
5. exportar un mapa PDF y un CSV;
6. calcular SHA-256;
7. actualizar el manifiesto incluido en el paquete.

## ArcGIS

Las capturas publicadas documentan el estado verificado. Sustituirlas solo después de revisar:

- fuentes rotas;
- cobertura catastral;
- estado de construcciones;
- ortofoto y modelos digitales;
- referencia vertical;
- acceso privado en ArcGIS Online.

No presentar una escena anterior como equivalente a la versión consolidada.

## Publicación

1. Ejecutar `npm run check`.
2. Revisar el sitio en 1440 × 900, 1024 × 768 y 390 × 844.
3. Confirmar contraste, teclado, enlaces y descargas.
4. Preparar la edición del sitio `v2.0.1` y conservar la descarga histórica `v2.0.0` sin sustituirla.
5. Comprobar que el enlace a `v2.0.0` entregue el ZIP intacto, con SHA-256 `fdce5a71a51b02a0b479967d3368c9d3d7f53fa62010bf2d2191e2eb5680fe74`.
6. Publicar `docs/` desde `main` mediante GitHub Pages.
7. Verificar la URL pública sin iniciar sesión.

## Texto

Usar frases directas. Cada sección responde una pregunta operativa y señala una evidencia. Evitar títulos repetidos, promesas sin medida y descripciones que no cambian una decisión.
