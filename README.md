# San Carlos · Taller de análisis territorial

Taller de una jornada con QGIS, Sentinel-2 y cartografía oficial del Instituto Geográfico Nacional de Costa Rica, publicada mediante el SNIT. El caso de estudio comprende los trece distritos del cantón de San Carlos.

**Ponente:** Andrés Castillo Leitón · Ingeniero Topógrafo.  
**Edición del material:** 11 de octubre de 2026. La fecha de edición no es una fecha de convocatoria.

## Acceso

- [Sitio del taller](https://apuitox04.github.io/san-carlos-taller/)
- [Datos, proyectos QGIS y documentos de la edición 1.0.0](https://github.com/apuitox04/san-carlos-taller/releases/tag/v1.0.0)

La consulta y las descargas públicas no requieren una cuenta de GitHub. El sitio no recibe inscripciones ni pagos.

## Contenido

| Sección | Contenido y uso |
| --- | --- |
| Presentación | 30 diapositivas; navegación por teclado, proyección, notas del ponente e impresión de la presentación completa. |
| Prácticas | Seis actividades con fundamento, procedimiento en QGIS, comprobaciones, solución y expediente del participante. |
| Atlas | Selección de los 13 distritos, cobertura válida, diferencias de NDVI, tabla distrital, pares de fechas y sensibilidad del umbral de MNDWI. |
| Materiales | Dos paquetes ZIP complementarios, cuaderno PDF, solucionario PDF y cuaderno HTML para trabajo sin conexión. |
| Ponente | Agenda de 08:00 a 16:00, ensayo de la sesión, criterios de revisión y propuesta de costo simbólico. |
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

1. Descargar **Taller_San_Carlos_Datos.zip** y **Taller_San_Carlos_Materiales.zip** desde la publicación 1.0.0.
2. Extraer ambos en el mismo directorio. Los contenidos forman una sola carpeta `Taller_San_Carlos/`; conservar su estructura para que funcionen las rutas relativas de los proyectos QGIS.
3. Seguir las instrucciones de instalación y apertura incluidas en **Materiales** y en el cuaderno de trabajo.
4. Ensayar P01–P06 con el solucionario antes de impartir la sesión. La sección **Ponente** permite registrar y descargar ese ensayo.

Los dos ZIP suman aproximadamente **658,5 MB** comprimidos. Los datos grandes se distribuyen como activos de la publicación, separados de los archivos que carga el sitio.

### Integridad de los paquetes

| Archivo | SHA-256 |
| --- | --- |
| Taller_San_Carlos_Datos.zip | `c9e0735bd7fbe3b57791f5707e5293f3720792f94d97117de01ad96b99ff62bf` |
| Taller_San_Carlos_Materiales.zip | `2ca4134b815cc6895a4df55ba0199a35fe266171bacf4b502f4166266305c60e` |

## Alcance de los resultados

El sitio presenta un **ejercicio docente**, con datos y resultados preparados. No ejecuta procesos ráster en el navegador ni sustituye el trabajo en QGIS.

- Los límites proceden del IGN / Registro Nacional, consultados mediante el SNIT el **11 de octubre de 2026**. El identificador de versión de la fuente se conserva como `20260410001`; no se interpreta como una fecha histórica del límite.
- El análisis usa una malla de **20 m** en **CR-SIRGAS / CRTM05, EPSG:8908** y observaciones Sentinel-2 de 2025. Las composiciones contienen distintas fechas por celda; el atlas presenta los seis pares de adquisición y sus intervalos.
- La comparación de NDVI conserva **4 979 989 celdas comunes**, equivalentes a **199 199,56 ha**, el **59,4264 %** de la superficie de la malla cantonal. Las celdas excluidas no se contabilizan como ausencia de cambio.
- El mapa SVG simplifica los polígonos para su visualización. Las superficies publicadas provienen de los resultados originales, no de una medición del SVG.
- Los umbrales de MNDWI ilustran sensibilidad de clasificación. No constituyen una delimitación validada de inundaciones o daños.

Fuentes: [servicio WFS del IGN en SNIT](https://geos.snitcr.go.cr/be/IGN_5_CO/wfs?service=WFS&request=GetCapabilities), [metadatos de la división territorial administrativa](https://meta2.snitcr.go.cr/geonetwork/srv/api/records/CR_IGN_LTA_DTA_5K_VE/formatters/xml) y los registros de procedencia incluidos en los paquetes. Las referencias de [MLSpAnFOSS](https://mlspanfoss.org/workshops) y la [reseña de GRSS IEEE](https://www.grss-ieee.pl/aktualnosci/relacja-z-mlspanfoss-2026/) se mantienen en **Fuentes y método**; esta adaptación para Costa Rica no atribuye a esas organizaciones la validación de sus resultados.

## Notas del participante

Las respuestas, notas y marcas de revisión se guardan en el almacenamiento local del navegador. No se envían al ponente ni se sincronizan entre equipos. El participante puede descargar su expediente en TXT o JSON. Conviene exportarlo al terminar cada sesión, especialmente si utiliza una computadora compartida.

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

Se comprobaron las rutas del sitio, la selección de distritos por teclado, los cálculos de las comprobaciones de prácticas, la conservación de notas, las exportaciones, la navegación de diapositivas y las referencias a archivos. Las comprobaciones de interacción se ejecutaron en un entorno DOM automatizado; no equivalen a una revisión visual en todos los navegadores.

El procesamiento de los materiales originales se ejecutó con QGIS 3.34.4 y GDAL 3.8.4 en modo sin interfaz. Esa comprobación no acredita un ensayo completo de la interfaz de QGIS 3.40.14 o 4.0.3; el ensayo del ponente debe realizarse en los equipos y la versión que se usarán durante el taller.

## Créditos

Los datos mantienen su autoría y las condiciones de sus respectivas fuentes. La tipografía IBM Plex Sans se distribuye con su licencia SIL Open Font License en `docs/assets/fonts/OFL.txt`. Los archivos de procedencia, fórmulas y resultados de la edición se conservan en las descargas. La publicación del repositorio no atribuye a terceros un patrocinio o una certificación del taller.
