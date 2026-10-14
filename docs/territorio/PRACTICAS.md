# Guía del workshop — San Carlos: análisis territorial aplicado

**Organización:** Unidad de Catastro de la Municipalidad de San Carlos. **Participación:** gratuita, instituciones y público general. **Sede propuesta:** Ecocampus de la UTN, La Abundancia, Ciudad Quesada. La UTN no ha confirmado reserva ni coorganización. **Fecha:** por definir.

## Marco institucional

El Acuerdo 2-16-2021 del Consejo Universitario UTN (Sesión 16-2021, 15 de julio de 2021) aprobó la estrategia regional en cuatro áreas: Reservas de la Biosfera, Educación Financiera, Innovación Agroindustrial y Atracción de Inversión Regional.

- Acuerdo: https://utn.ac.cr/sites/default/files/attachments/Gaceta%20Julio-55-2021.pdf
- Cátedra de la Reserva Agua y Paz: https://www.utn.ac.cr/sedes/sede-regional-de-san-carlos?type=6
- PROCOMER, perfil Huetar Norte: https://procomer.com/procomer-presenta-perfil-de-region-huetar-norte-para-incentivar-oportunidades-de-inversion/

La actividad municipal utiliza herramientas estudiadas en MLSpAnFOSS, pero no es organizada ni acreditada por MLSpAnFOSS, IEEE, OSGeo o la UTN.

## Competencias al finalizar

La persona participante podrá verificar procedencia, CRS, escala, fechas y cobertura; ejecutar operaciones GDAL y álgebra ráster; interpretar un agrupamiento exploratorio; separar valores calculados de hipótesis; evaluar un flujo de caja hipotético; y comunicar restricciones que impiden inferir aptitud agroindustrial, ambiental o de inversión.

## Programa de un día — 08:30 a 16:30

| Horario | Tiempo efectivo | Actividad | Evidencia |
|---|---:|---|---|
| 08:30–09:00 | 30 min | Contexto, ejes UTN y criterios | Pregunta territorial |
| 09:00–09:45 | 45 min | P01: base territorial | Proyecto QGIS, ficha de fuentes |
| 09:45–10:00 | — | Pausa | |
| 10:00–11:05 | 65 min | P02: Reserva de Biosfera | Matriz de límites y capas |
| 11:05–12:15 | 70 min | P03: innovación agroindustrial | Intensidades, disparity, KMeans |
| 12:15–13:15 | — | Almuerzo | |
| 13:15–14:10 | 55 min | P04: educación financiera | VAN y sensibilidad |
| 14:10–15:20 | 70 min | P05: inversión regional | Matriz multicriterio de datos |
| 15:20–15:35 | — | Pausa | |
| 15:35–16:30 | 55 min | P06: informe integrado | Expediente técnico |
| **Total** | **390 min** | | |

## Insumos comprobados en la edición anterior

Se dispone de cuatro conjuntos de huellas para los 13 distritos y de sus rásteres derivados de 250 m: IGN 75.442 registros, Microsoft 80.584, Google 145.611, Overture 126.868. **No sumarlos como edificios únicos.** Las fechas de publicación no determinan fechas de construcción. La delimitación presente en el ZIP debe cotejarse con la DTA vigente del IGN antes de publicar cifras oficiales. Los 53.606 píxeles incluidos fueron rasterizados con ese límite didáctico.

### P01 — Base oficial y metadatos

Abrir el proyecto QGIS preparado. Consultar el servicio de DTA IGN/SNIT para comparar atributos y perímetros. Con GDAL inspeccionar geotransformación y NoData de `google_registros_250m.tif`. Evidencia: tabla de origen y diferencias que requieran corrección. Control: 13 códigos de distrito en el GeoPackage didáctico.

### P02 — Reserva de Biosfera Agua y Paz

Fuentes: Comisión UNESCO Costa Rica (https://www.comisionunesco.cr/agua-y-paz), datos de UNESCO (https://biodiversity.unesco.org/explore/map/CRAg2007), SINAC (https://www.sinac.go.cr/ES/asp/Paginas/default.aspx). Se deben obtener las geometrías o la cartografía oficial **antes de la clase** y documentar su versión. Las reservas de biosfera tienen zonificación MaB distinta de las ASP nacionales. No atribuir a San Carlos las 916.120 ha completas de Agua y Paz. Ejercicio: delimitación de intersecciones y anotación de restricciones. No hay cifra calculada de intersección en la edición actual.

### P03 — Innovación agroindustrial

Ejecutar la intensidad por distrito y la disparidad D = |G−M|/(G+M+1) sobre las cuadrículas Google y Microsoft; reproducir KMeans con datos de cuatro proveedores. Quesada: 27.888 huellas Google sobre 143,7409 km²; Cutris: 11.654 sobre 849,3837 km². No deducir ubicación de fábricas, área sembrada o productividad desde estos recuentos. Para esa inferencia hacen falta datos sobre agroindustrias, agricultura, red vial y logística.

### P04 — Educación financiera

Escenario **hipotético** de inversión municipal en información territorial: CAPEX ₡2.000.000, OPEX ₡300.000/año, beneficio anual ₡900.000, descuento 8 %, cinco años. Flujo neto: ₡600.000/año. Calcular VAN = -I + Σ(B−C)/(1+r)^t y recuperación simple; modificar el beneficio anual −25 %. Identificar cuál dato real tendría que recabarse antes de justificar una inversión. No usar estimaciones como ingresos tributarios o económicos reales.

### P05 — Atracción de inversión regional

Consultar el perfil PROCOMER Huetar Norte. Definir una secuencia de filtros: primero exclusiones legales y ambientales, luego disponibilidad del suelo, accesibilidad, servicios básicos, talento y riesgo. Ponderar criterios únicamente tras disponer de capas y evidencias verificables. Entregar ficha con fuente, escala, cobertura, fecha, entidad custodio y estado "disponible / requerido / no verificado". No recomendar un distrito ni terreno sin capas de acceso, restricciones y redes.

### P06 — Informe final

Entregar mapa y matriz de cuatro ejes: pregunta, datos utilizados, operaciones, resultado, alcance, limitaciones y siguiente comprobación. Separar **indicadores calculados** (huellas), **condiciones documentadas** (fuentes oficiales) y **escenarios hipotéticos** (finanzas). La evaluación prioriza reproducibilidad, dominio de los denominadores y límites de validez.

## Herramientas

- GDAL: `gdalinfo`, `gdalbuildvrt`, `gdal_translate` (MLSpAnFOSS Workshop V).
- plMapcalc: calculadora ráster y operaciones por celda; pendiente de ensayo en Windows con plTools.
- Jupyter/Python: cuaderno KMeans del laboratorio. La ejecución previa está verificada.
- QGIS: cruce espacial, estilos, productos cartográficos y CSV/GeoPackage.

**No incluidos en esta jornada:** ejecución integral de Flower y computación cuántica; cualquier modelo automatizado de idoneidad, cobertura de cultivos o estado ambiental que no disponga de datos y validación.
