# Investigación y selección de contenidos

Consulta documental: 17 octubre 2026. Reconstrucción de archivos: 18 octubre 2026.

## Pertinencia académica
El perfil UTN vincula gestión agroindustrial, tecnología y optimización de recursos (R01). Se seleccionan productos para decisiones y controles, no una formación de pilotaje. MAG documenta adopción y extensión en agricultura de precisión (R19–R21). Café, piña, caña, pasturas e inventarios son contextos posibles; su uso local requiere datos y acuerdos. No se atribuyen ahorros.

## Manuales aportados
M01 Fields Essentials, 487 páginas: fundamentos, límites, índices, radiometría, estadísticas y dos casos. Targeted Operations ocupa páginas PDF 300–317 y Field trial 318–333. M02 Matic Essentials Standard 2026, 313 páginas: entradas, coordenadas, control, calibración y productos. M03 mapper Essentials y M04 mapper In-depth: fundamentos y antecedentes; sus botones y menús no se trasladan a Matic. No se redistribuyen los cuadernos.

## Plataformas y versiones
Matic Standard y Pro reconstruyen fotografías: calibración, nube, malla, DSM y ortomosaico; Pro añade funciones topográficas (R02). Referencia estable 2.10.3; 2.12.0 se identifica como preview (R03). Fields 2.13.5: procesamiento agrícola, índices, límites, estadísticas y operaciones (R04, R06). No se confunde procesamiento rápido con comprobación geométrica independiente. Fields no admite GCP y su licencia de prueba bloquea exportación (R06, R15). Las versiones son referencias documentales, no instalaciones ensayadas.

## Interoperabilidad
Matic exporta GeoTIFF de ortomosaico y DSM, LAS/LAZ/XYZ, OBJ e informe PDF (R05). Fields admite imágenes y GeoTIFF y produce índices y salidas operativas según licencia y equipo (R06). Un ortomosaico RGB no crea bandas Red Edge o NIR. DATA.TIF conserva valores; el raster coloreado sirve para presentación. El destino debe conservar CRS, unidades, bandas, NoData y fecha. La apertura en un receptor no certifica compatibilidad de maquinaria.

## Captura y conceptos
Mavic 3M: RGB 20 MP y cuatro cámaras 5 MP G R RE NIR; se adopta ficha técnica R14 ante discrepancias de la FAQ. Separar RGB y multiespectral, desactivar Dewarping en RGB y revisar nadir y radiometría (R13). GSD no equivale a exactitud. Las alturas elipsoidales y ortométricas no se intercambian sin transformación documentada.

NDVI=(NIR−Red)/(NIR+Red); NDRE=(NIR−Red Edge)/(NIR+Red Edge). Son adimensionales. Con reflectancias no negativas y denominador distinto de cero, el rango teórico es [−1,1]. Enmascarar NoData y denominador cero. No existen umbrales universales que sustituyan diagnóstico de campo. No comparar fechas sin controles radiométricos y fenológicos.

## Casos y certeza de la evidencia
1. Ejemplo oficial de capacitación Matic100: Suiza, 100 RGB AeriaX, eBee X, tres GCP, EPSG 32632 y altura elipsoidal WGS84. No es un levantamiento agrícola UTN.
2. Ejemplo oficial Field trial: Alemania, trigo, Bluegrass/Sequoia, 1328 imágenes, 50 m, 5.1 cm GSD, aproximadamente 1 ha (M01). Rostock y Winter wheat públicos son otros conjuntos; la ficha Winter wheat presenta una discrepancia de cámara. No se mezclan sus resultados.
3. Ejemplo oficial Targeted Operations: zarzamora en pastura australiana, XAG M500 RGB, 254 imágenes, 60 m, 3.15 cm GSD y aproximadamente 10 ha (M01). Rumex con Mavic 3M es otro caso (R18).
4. Simulaciones didácticas: diagrama de parcelas, cuadrícula Magic, fórmulas interactivas y presupuesto. No son resultados calculados de los casos.
5. Propuestas pendientes: prácticas con productores de Costa Rica, curso, presupuesto final y aprobación UTN.

## Selección y viabilidad en 120 minutos
Conservar el horario solicitado. Matic 30 min, índices 30 min y Magic 15 min solo son viables con proyectos listos. El guion limita exposición conceptual y reserva tiempo para decisiones. Descargar y procesar antes. No existe ensayo cronometrado en esta producción: registrar versión, licencia, datos y duración en las plantillas antes de anunciar demostraciones operativas. Sin ello usar la alternativa documental, identificándola.

## Límites de esta producción
No se ejecutaron aplicaciones Pix4D ni proyectos nativos. Las vistas incluidas son imágenes públicas oficiales, no capturas tomadas de una instalación vigente. No se fabrican informes, índices, estadísticas ni exportaciones. Las guías documentan rutas del material de capacitación que deben confirmarse en la versión instalada. El requisito de proyecto previamente procesado sigue pendiente.
