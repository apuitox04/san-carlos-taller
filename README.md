# Proyectos de formación geoespacial · Municipalidad de San Carlos

## Workshop cantonal — cuatro ejes estratégicos UTN

**San Carlos: análisis territorial aplicado**, actividad gratuita de la Unidad de Catastro, dirigida a instituciones y público general.

- [Abrir el workshop en GitHub Pages](https://apuitox04.github.io/san-carlos-taller/territorio/)
- [Guía de las prácticas](docs/territorio/PRACTICAS.md)
- [Fundamento oficial y matriz de alineamiento](docs/territorio/ALINEAMIENTO_UTN.md)
- [Matriz de evaluación para 13 distritos y 4 ejes](docs/territorio/matriz_evaluacion_territorial.csv)
- [Escenario financiero ilustrativo](docs/territorio/escenario_financiero_ejemplo.csv)

El programa sigue los cuatro ejes aprobados en el Acuerdo 2-16-2021: Reservas de la Biosfera, Educación Financiera, Innovación Agroindustrial y Atracción de Inversión Regional. La UTN se considera sede propuesta, sin coorganización o fecha confirmadas. Los indicadores computados son de registros de huellas; las superficies ambientales y las evaluaciones de aptitud todavía requieren capas verificables.

---

## Taller independiente de La Fortuna



Curso municipal de cuatro horas para revisar información territorial y acordar su actualización con instituciones de la Zona Norte.

## Edición vigente

- Versión: 2.0.0
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
| 120–160 | P03 Altura y forma urbana |
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

El paquete `Taller_La_Fortuna_Datos_y_Proyecto.zip` se distribuye como activo de la publicación 2.0.0 para evitar cargar datos pesados en GitHub Pages.

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
