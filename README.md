# Taller interinstitucional de información territorial de La Fortuna

Curso municipal de cuatro horas para revisar información territorial y acordar su actualización con instituciones de la Zona Norte.

## Edición vigente

- Versión del sitio revisado: 2.0.1
- Fecha: 12 de octubre de 2026
- Alcance: área urbana de La Fortuna, con ampliación posterior al distrito
- Duración: 240 minutos
- Grupo: 24 a 30 personas en cinco mesas
- Trabajo práctico: QGIS y GDAL
- Demostración: ArcGIS Pro y ArcGIS Online

El sitio público se publica desde `docs/`:

<https://apuitox04.github.io/san-carlos-taller/>

## Resultado de la sesión

Cada mesa entrega:

1. proyecto QGIS con rutas relativas y EPSG:8908;
2. mapa PDF con cobertura, vacíos y fuentes;
3. CSV con un indicador y sus parámetros;
4. matriz con custodio, validador, frecuencia, acceso y control de calidad;
5. acciones con responsable y plazo.

## Secuencia

| Minuto | Trabajo |
| ---: | --- |
| 00–15 | Alcance, pregunta y reglas |
| 15–35 | Estado municipal en ArcGIS |
| 35–65 | P01 Base territorial |
| 65–110 | P02 Observación satelital |
| 110–120 | Pausa y respaldo |
| 120–160 | P03 Demostración municipal 3D |
| 160–200 | P04 Mesas sectoriales |
| 200–230 | P05 Acuerdos |
| 230–240 | Exportación y cierre |

## Mesas

1. Catastro y planificación urbana.
2. Ambiente y agua.
3. Producción y desarrollo rural.
4. Riesgo e infraestructura.
5. Conectividad, turismo y comunidad.

La convocatoria solicita una persona técnica y otra con capacidad para acordar responsabilidades por entidad. Se propone invitar a Municipalidad de San Carlos, Registro Nacional/IGN, MINAE, SINAC–ACAHN, MAG, INTA, INDER, CFIA, CNE/CME, MOPT/CONAVI, ICE, AyA/ASADAS, MICITT, SUTEL/FONATEL, ICT, sector turístico, ADIFORT, academia y comunidad.

## Archivos

| Ruta | Uso |
| --- | --- |
| `docs/index.html` | Curso interactivo |
| `docs/content/course.json` | Agenda, prácticas, mesas, estado y fuentes |
| `docs/recursos/guia-facilitacion.md` | Preparación y conducción |
| `docs/recursos/matriz-acuerdos.csv` | Registro institucional |
| `docs/recursos/ficha-observacion.csv` | Control técnico |
| `docs/LICENCIAS_Y_DATOS.md` | Condiciones de uso |
| `scripts/check.mjs` | Verificación local |

## Alcance del paquete

El archivo `Taller_La_Fortuna_Datos_y_Proyecto.zip` permanece como activo de la publicación **v2.0.0**, con SHA-256 `fdce5a71a51b02a0b479967d3368c9d3d7f53fa62010bf2d2191e2eb5680fe74`. Contiene proyecto QGIS, límite distrital IGN 21007, insumos Sentinel-2, indicadores y plantillas. **No contiene el límite urbano oficial ni las parcelas municipales, ortofotos, modelos DTM/DSM, LAS o edificios LoD2.2.** El ámbito del ejercicio no coincide necesariamente con los 691,216 ha del piloto urbano.

P01–P02 se realizan con los datos entregados. P03 utiliza una demostración con acceso municipal autorizado y genera una ficha; no certifica modelos 3D. P04 y P05 documentan acuerdos. El sitio v2.0.1 revisa estas instrucciones sin modificar el ZIP publicado.

## Fuente del paquete

El paquete `Taller_La_Fortuna_Datos_y_Proyecto.zip` se descarga de la [publicación v2.0.0](https://github.com/apuitox04/san-carlos-taller/releases/tag/v2.0.0).

## Ejecución local

El sitio usa HTML, CSS, JavaScript y JSON. Debe servirse por HTTP:

```powershell
python -m http.server 8080 --directory docs
```

Si Python no está disponible:

```powershell
npx --yes serve docs
```

Abrir <http://localhost:8080> y ejecutar después:

```powershell
npm run check
```

## Referencia MLSpAnFOSS

La agenda adapta ejercicios sobre Raster Calculator y GDAL publicados por [MLSpAnFOSS](https://www.mlspanfoss.org/workshops). Este curso municipal no cuenta con acreditación, aval o patrocinio de sus organizadores.

## Licencias

- Código HTML, CSS y JavaScript: MIT.
- Textos originales: CC BY 4.0.
- Marcas municipales, tipografías y datos de terceros: condiciones propias.

Consulte [LICENCIAS_Y_DATOS.md](docs/LICENCIAS_Y_DATOS.md).
