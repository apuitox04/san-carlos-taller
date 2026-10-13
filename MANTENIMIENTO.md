# Mantenimiento del laboratorio de análisis territorial 3.0

## Alcance
El taller corresponde al distrito 21007 La Fortuna y utiliza la colección de paisajes documentada en `docs/content/course.json`. No sustituye el proyecto municipal urbano de 691,216 ha. La rama `main` conserva la edición actualmente publicada; esta revisión está en un PR borrador.

## Datos
- Conservar ZIP v2.0.0 sin alterar sus huellas digitales.
- Publicar el paquete distrital ampliado como nueva edición independiente, con manifiesto, fuente y SHA-256.
- El índice calculado no se convierte en cobertura validada, área protegida, ciudad, cultivo, riesgo ni derecho.
- La máscara de comparación de F1 y F2 **no supera 29,18 %** en el paquete original; reportar denominador.
- No añadir geometrías oficiales si no se dispone de fuente y licencia confirmadas.

## Reproducibilidad
1. Ejecutar pipeline `codigo/analizar_lafortuna.py` en el paquete ampliado y comparar JSON/CSV.
2. Abrir QGIS en EPSG:8908 y comprobar sus 11 capas y rutas relativas.
3. Validar mapas y títulos; blancos representan **sin dato aceptado**.
4. Instalar y probar plMapcalc/plTools antes de ofrecer comandos como verificados. plForestFragment y plGeoJSEG son extensiones condicionadas a datos forestales y temáticos validados.
5. Conservar reporte de pruebas, entrada, transformación, versiones, identificadores y responsable.

## Sitio
- Fuente programática: `docs/content/course.json`; duración obligatoria 240 min, módulos P01–P06, mesas M1–M5.
- Control: `npm run check`.
- Revisar visualmente en móvil y escritorio, teclado y navegación, permisos de enlaces.
- Publicación GitHub Pages solo tras fusionar PR y confirmar ejecución del despliegue.
- Marcas oficiales y tipografías con licencias propias; no alterar proporciones.
