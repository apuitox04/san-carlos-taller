# La Fortuna | Laboratorio de análisis territorial

**Municipalidad de San Carlos · Catastro y Censos · Revisión 3.0.0**

Workshop gratuito y presencial, de cuatro horas, para instituciones y público general. Utiliza las herramientas y prácticas publicadas en MLSpAnFOSS 2026 como referencia metodológica, sin acreditación ni patrocinio de sus organizadores.

## Pregunta de trabajo
¿Qué información tenemos para explicar cómo interactúan bosque, Parque Nacional Volcán Arenal, embalse Arenal, asentamientos, agricultura y redes en el distrito 21007 La Fortuna?

**La unidad de estudio es el distrito completo**, con 22.957,84 ha representadas en la cuadrícula del paquete Sentinel-2. El piloto municipal de cartografía urbana de 691,216 ha es independiente.

## Herramientas
1. **QGIS**: fuentes, inspección y mapas.
2. **GDAL**: rasterización, índices espectrales, control de datos y operaciones reproducibles.
3. **plMapcalc**: álgebra de mapas; alternativa del taller MLSpAnFOSS.
4. **plForestFragment/plGeoJSEG**: extensión avanzada opcional sobre datos temáticos validados.
5. **Jupyter/Python**: reconstrucción de indicadores.

## Distribución de los 240 minutos
| Min | Tema |
|---:|---|
| 00–15 | Presentación de paisajes y preguntas |
| 15–40 | P01 Referencias y cobertura |
| 40–80 | P02 Lago/agua (MNDWI) |
| 80–120 | P03 Vegetación/parque (NDVI) |
| 120–130 | Pausa |
| 130–170 | P04 Área urbana/agricultura (NDBI y comparación) |
| 170–200 | P05 Relieve, acceso, riesgos y capas pendientes |
| 200–230 | P06 Diagnóstico en cinco mesas |
| 230–240 | Consolidación y entrega |

## Datos y resultados
El ZIP público anterior `v2.0.0` incorpora el límite IGN/SNIT, reflectancias L2A compuestas de 2025 (B03, B04, B08 y B11), máscaras, NDVI, cuatro puntos de revisión, proyecto QGIS y registros de control. Se mantienen sus identificadores y su SHA-256 original.

El complemento local v3.0.0 añade MNDWI, NDBI, firmas espectrales exploratorias, proyecto QGIS actualizado, mapas y guías, sin incorporar información municipal privada. El soporte común de las dos composiciones cubre **6.699,88 ha (29,18 %)** de la cuadrícula distrital. No se infieren porcentajes de cobertura del suelo sobre el área sin observación aceptada.

**No están incluidos** los perímetros oficiales de parque, embalse, áreas urbanas o fincas agrícolas. No confundir firmas espectrales con usos jurídicos o una zonificación vigente.

## Acceso al sitio
El despliegue público vigente depende de fusionar el PR de revisión; la versión preliminar no se considera publicada por estar solo en una rama:
https://apuitox04.github.io/san-carlos-taller/

Archivos de revisión:
- `docs/content/course.json` - programa y casos;
- `docs/recursos/guia-facilitacion.md` - conducción;
- `docs/recursos/fuentes_y_umbrales.md` - fuentes y fórmulas;
- `scripts/check.mjs` - control automático.

## Reproducir localmente
```bash
python -m http.server 8080 --directory docs
npm run check
```
La URL del sitio no garantiza que el paquete ampliado v3.0 esté publicado en Releases. La versión histórica v2.0.0 permanece en: https://github.com/apuitox04/san-carlos-taller/releases/tag/v2.0.0

## Licencias
Código: MIT. Textos originales: CC BY 4.0. plTools conserva su licencia GPLv3 y las fuentes de terceros sus condiciones propias. Ver `docs/LICENCIAS_Y_DATOS.md`.
