# San Carlos con datos abiertos

**Workshop · QGIS, Sentinel-2 y cartografía oficial IGN/SNIT**

Taller gratuito de una jornada, impartido por la **Unidad de Catastro de la Municipalidad de San Carlos** y dirigido a **instituciones y público general**. Se trabaja con QGIS, Sentinel-2 y cartografía oficial del Instituto Geográfico Nacional de Costa Rica, publicada mediante el SNIT. El caso de estudio comprende los trece distritos del cantón de San Carlos.

**Facilitador:** Andrés Castillo Leitón · Ingeniero Topógrafo.  
**Participación y materiales:** gratuitos.  
**Edición del material:** 11 de octubre de 2026. La fecha de edición no es una fecha de convocatoria.

## Acceso

- [Sitio del taller](https://apuitox04.github.io/san-carlos-taller/)
- [Datos, proyectos QGIS y documentos de la edición 1.0.2](https://github.com/apuitox04/san-carlos-taller/releases/tag/v1.0.2)

La participación en el taller y la descarga de sus materiales son gratuitas. La consulta pública no requiere una cuenta de GitHub.

## Contenido

| Sección | Contenido y uso |
| --- | --- |
| Programa | Identificación municipal, presentación del workshop y seis prácticas con duración, producto y acceso directo. |
| Preparar el equipo | Descarga de ambos paquetes, estructura de carpetas, apertura del proyecto y cuatro comprobaciones del equipo. |
| Presentación | 30 diapositivas; navegación por teclado, proyección, notas del ponente e impresión de la presentación completa. |
| Prácticas | Seis actividades divididas en 28 tareas. Cada tarea reúne objetivo, operación, salida, comprobación y registro; el manual y la resolución siguen disponibles. |
| Mi trabajo | Resumen de las seis prácticas, notas y respuestas, informe, S06, exportación TXT/JSON y restauración de un JSON con revisión previa. |
| Atlas | Mapa e inspector de San Carlos y sus 13 distritos, tabla, soporte común, umbrales de MNDWI y fechas. Copia de resultados para el informe y descargas CSV. |
| Datos y materiales | Dos paquetes ZIP complementarios, cuaderno PDF, solucionario PDF y cuaderno HTML para trabajo sin conexión. |
| Guía de facilitación | Agenda de 08:00 a 16:00, ensayo de la sesión, criterios de revisión y organización de la actividad municipal gratuita. |
| Fuentes y método | Procedencia de los límites, observaciones satelitales, decisiones de procesamiento y referencias del taller. |

### Secuencia de prácticas

| Código | Práctica | Minutos |
| --- | --- | ---: |
| P01 | El territorio y su superficie | 40 |
| P02 | Bandas, fechas y calidad | 55 |
| P03 | Índices y exclusiones | 70 |
| P04 | Comparar las mismas celdas | 70 |
| P05 | Los trece distritos | 65 |
| P06 | El informe y el mapa | 70 |

Las prácticas ocupan 370 minutos. La apertura y la revisión final suman otros 20 minutos; los descansos y el almuerzo completan la jornada de ocho horas.

## Preparar una computadora

1. Descargar **Taller_San_Carlos_Datos.zip** y **Taller_San_Carlos_Materiales.zip** desde la publicación 1.0.2.
2. Extraer ambos en el mismo directorio. Los contenidos forman una sola carpeta `Taller_San_Carlos/`; conservar su estructura para que funcionen las rutas relativas de los proyectos QGIS.
3. Abrir **Preparar el equipo** y comprobar instalación de QGIS, extracción conjunta, apertura de `proyectos/01_Practica.qgz` y copia en `mi_trabajo/Practica_San_Carlos.qgz`.
4. Ensayar P01–P06 con el solucionario antes de impartir la sesión. La sección **Guía de facilitación** permite registrar y descargar ese ensayo.

Los dos ZIP suman **663,7 MB** comprimidos (663 673 622 bytes). Los datos grandes se distribuyen como activos de la publicación, separados de los archivos que carga el sitio.

### Integridad de los paquetes

| Archivo | SHA-256 |
| --- | --- |
| Taller_San_Carlos_Datos.zip | `0abb6b073d05826b379436abeaaf3d0e9dcd9d6f8b2b8bdba4dcefdafb4342f5` |
| Taller_San_Carlos_Materiales.zip | `58cb0696f62f2b033ecb4a523ce577b2d45c3492807b385b95bf5c28ebc9c393` |

## Alcance de los resultados

El sitio presenta un **ejercicio docente**, con datos y resultados preparados. No ejecuta procesos ráster en el navegador ni sustituye el trabajo en QGIS.

- Los límites proceden del IGN / Registro Nacional, consultados mediante el SNIT el **11 de octubre de 2026**. El identificador de versión de la fuente se conserva como `20260410001`; no se interpreta como una fecha histórica del límite.
- El análisis usa una malla de **20 m** en **CR-SIRGAS / CRTM05, EPSG:8908** y observaciones Sentinel-2 de 2025. Las composiciones contienen distintas fechas por celda; el atlas presenta los seis pares de adquisición y sus intervalos.
- La comparación de NDVI conserva **4 979 989 celdas comunes**, equivalentes a **199 199,56 ha**, el **59,4264 %** de la superficie de la malla cantonal. Las celdas excluidas no se contabilizan como ausencia de cambio.
- El mapa SVG simplifica los polígonos para su visualización. Las superficies publicadas provienen de los resultados originales, no de una medición del SVG.
- Los umbrales de MNDWI ilustran sensibilidad de clasificación. No constituyen una delimitación validada de inundaciones o daños.

Fuentes: [servicio WFS del IGN en SNIT](https://geos.snitcr.go.cr/be/IGN_5_CO/wfs?service=WFS&request=GetCapabilities), [metadatos de la división territorial administrativa](https://meta2.snitcr.go.cr/geonetwork/srv/api/records/CR_IGN_LTA_DTA_5K_VE/formatters/xml) y los registros de procedencia incluidos en los paquetes. Las referencias de [MLSpAnFOSS](https://mlspanfoss.org/workshops) y la [reseña de GRSS IEEE](https://www.grss-ieee.pl/aktualnosci/relacja-z-mlspanfoss-2026/) se mantienen en **Fuentes y método**; esta adaptación para Costa Rica no atribuye a esas organizaciones la validación de sus resultados.

## Notas del participante

Las respuestas, notas, tarea activa y marcas de revisión se guardan en el almacenamiento local del navegador. No se envían al ponente ni se sincronizan automáticamente entre equipos. **Mi trabajo** permite exportar el expediente como TXT legible o JSON restaurable. Al cargar un JSON, el sitio muestra las prácticas que contiene y espera una acción explícita antes de reemplazar sus registros. Admite las exportaciones anteriores de la edición web 1.0 y las nuevas de la edición 1.1.

La revisión de una tarea es una marca del participante. Los controles numéricos contrastan cantidades con resultados de referencia; la interpretación del informe requiere revisión técnica. Si el navegador bloquea el almacenamiento, el sitio lo indica y mantiene las notas durante la sesión. Conviene exportar una copia al terminar.

## Ejecutar y mantener el sitio

El sitio utiliza HTML, CSS y módulos JavaScript. No necesita un proceso de compilación ni dependencias de producción.

```sh
git clone https://github.com/apuitox04/san-carlos-taller.git
cd san-carlos-taller
python3 -m http.server 8080 --directory docs
```

Abrir `http://localhost:8080`. Se debe servir por HTTP porque los módulos cargan archivos JSON; abrir `index.html` directamente mediante `file://` no es el modo de uso del sitio. Para trabajar sin servidor, descargar el cuaderno HTML independiente de la publicación.

Con Node.js disponible, ejecutar la comprobación de integridad antes de publicar cambios:

```sh
npm run check
```

El repositorio publica `docs/` desde la rama `main` mediante GitHub Pages. La copia de edición en ChatGPT Sites utiliza los mismos archivos en `dist/`; el verificador reconoce ambas ubicaciones.

Véase [MANTENIMIENTO.md](MANTENIMIENTO.md) para localizar el contenido y actualizar una edición.

## Comprobaciones de esta edición

La edición web **1.3.0** incorpora el título **San Carlos con datos abiertos** y la identidad municipal en la portada, navegación y 30 diapositivas. El programa presenta las seis prácticas con duración, producto y acceso. Los materiales **1.0.2** aplican la misma identidad a los cuadernos, mapas y proyectos QGIS; conservan los datos, cálculos y resultados de **1.0.0**. El ZIP de datos es idéntico al activo de **1.0.1**.

Se verificaron la sintaxis, las rutas y la estructura de seis prácticas, 28 tareas y 30 diapositivas. Los dos ZIP contienen 312 archivos, cotejados contra su manifiesto conjunto, sin rutas duplicadas. La revisión de los PDF conserva las 24 páginas del cuaderno y las 26 del solucionario; mantiene el texto técnico de las páginas interiores y el área analítica de los mapas.

En la edición web 1.1 se comprobaron la preparación, el avance de tareas, la conservación de registros anteriores, la restauración con revisión previa, la selección del atlas, las exportaciones y los controles de presentación en un entorno DOM automatizado. La revisión 1.3 conserva esa lógica y los identificadores de las prácticas; la importación admite el título anterior y el nuevo. Esta verificación no equivale a una revisión visual en navegadores y dispositivos reales.

El procesamiento de los materiales originales se ejecutó con QGIS 3.34.4 y GDAL 3.8.4 en modo sin interfaz. Esa comprobación no acredita un ensayo completo de la interfaz de QGIS 3.40.14 o 4.0.3; el ensayo del ponente debe realizarse en los equipos y la versión que se usarán durante el taller.

## Créditos

La identidad sigue el [libro de marca publicado por la Municipalidad de San Carlos](https://www.munisc.go.cr/documentos/Secciones/52/Libro%20de%20Marca%20Completo.pdf), edición 2015: azul `#14416E`, fondo blanco, texto gris `#5D5D5D` y Museo Sans 300, 500 y 900. El escudo, la marca cantonal y la franja proceden del documento oficial; las fuentes proceden del portal municipal. Su procedencia se documenta en [docs/assets/brand/PROCEDENCIA.md](docs/assets/brand/PROCEDENCIA.md).

Los datos mantienen su autoría y las condiciones de sus respectivas fuentes. La licencia SIL de IBM Plex Sans, conservada en `docs/assets/fonts/OFL.txt` como recurso de la edición anterior, no se aplica a Museo Sans ni a las marcas municipales. Los archivos de procedencia, fórmulas y resultados se conservan en las descargas. La publicación no atribuye a terceros un patrocinio o una certificación del workshop.
