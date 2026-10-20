# Presentación gráfica v2

Versión editorial del 20 de octubre de 2026. 21 diapositivas, 16:9.

## Archivos

- PowerPoint editable: `../pptx/UTN_Drones_Agricultura_Grafica_v2.pptx`.
- PDF de distribución: `../pdf/UTN_Drones_Agricultura_Grafica_v2.pdf`.
- Gráficos PNG: `laminas/`, 1920 × 1080 píxeles.
- Registro de contenido, recursos y fuentes por lámina: `registro-grafico.json`.
- Composición: `../../scripts/presentacion-grafica-v2.mjs`.
- PDF, vista previa y paquete: `../../scripts/empaquetar-grafica-v2.py`.

Los diagramas, textos y fórmulas son objetos editables en PowerPoint. Las fotografías y capturas conservan su naturaleza raster. El PDF reproduce visualmente las diapositivas como imágenes de alta resolución. No incorpora capas SIG ni modelos 3D interactivos.

## Procedencia y alcance

Se utilizan fotografías reales, imágenes oficiales y diagramas conceptuales originales. No se generaron imágenes sintéticas. Los esquemas de vuelo y operación no tienen coordenadas, resultados de clasificación ni dosis asignadas.

Las capturas de PIX4Dmatic corresponden a documentación pública. El panel de calibración identifica 2.4.0. No son capturas de una instalación local de Pro. Las vistas de ortomosaico y DSM del informe oficial representan un área urbana y explican la diferencia entre productos.

El ejemplo público de estadísticas es distinto del caso Field trial del workbook. Se identifica expresamente en la diapositiva 14. La comparación RGB/NDVI de la diapositiva 15 pertenece al ejemplo público My first vegetation index map, también distinto de Field trial. El caso Targeted Operations de zarzamora aparece mediante un diagrama original de procedimiento. No se publican el cuaderno ni capturas extraídas de él.

No se afirma que este proyecto haya procesado fotografías o ejecutado Magic Tool. La ejecución de los proyectos nativos continúa pendiente en la estación del instructor.

## Actualización

Para cambios de texto, color o posición, abrir la versión v2 en PowerPoint y editar sus objetos. Mantener las notas, fuentes y etiquetas de procedencia. Las capturas se sustituyen solo por imágenes verificadas de la misma función o del proyecto identificado.

Para regenerar en ChatGPT Work, ejecutar el archivo `.mjs` con Node y las dependencias `@oai/artifact-tool` y `sharp` del entorno. Instalar la fuente Fira Sans incluida en `assets/fuentes`. Después ejecutar el script Python de empaquetado con Pillow y ReportLab. Revisar visualmente todas las láminas y ejecutar los verificadores de integridad y geometría antes de distribuir una nueva versión.

Los derechos de las imágenes de terceros permanecen con sus titulares. Ver `assets/CREDITOS.md` y `REFERENCIAS.md`.
