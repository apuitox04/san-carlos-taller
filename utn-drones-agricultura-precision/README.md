## Presentación gráfica v2

Versión del 20 de octubre de 2026.

- [PowerPoint editable](presentacion/pptx/UTN_Drones_Agricultura_Grafica_v2.pptx)
- [PDF de distribución](presentacion/pdf/UTN_Drones_Agricultura_Grafica_v2.pdf)
- [Paquete de gráficos](presentacion/Graficos_Presentacion_UTN_v2.zip)
- [Vista previa](presentacion/graficos-v2/Vista_previa_grafica_v2.jpg)
- [Fuentes y actualización](presentacion/graficos-v2/README.md)

# Taller UTN · Drones y agricultura de precisión

Materiales para Administración Agroindustrial. Taller demostrativo de 120 minutos. Proyecto independiente dentro del repositorio existente de talleres; no modifica los anteriores.

## Acceso
- Sitio: https://apuitox04.github.io/san-carlos-taller/agroindustrial/
- [Presentación editable](presentacion/pptx/UTN_Drones_Agricultura.pptx) y [PDF](presentacion/pdf/UTN_Drones_Agricultura.pdf).
- Afiches en `afiche/editable/` y `afiche/exportaciones/`.
- Programa, guion y ficha en `taller/`.
- Guías y registros en `ejercicios/`.
- Propuesta independiente en `propuesta-curso/`.
- [Informe de verificación](verificacion/Informe_verificacion.pdf), [investigación](investigacion/revision-tecnica.md) y [referencias](REFERENCIAS.md).

## Estado de uso
Documentos y recursos producidos. Los proyectos nativos de Pix4D no se han procesado ni ensayado en esta producción. Antes de anunciar una demostración operativa, completar registros, licencia, apertura, resultados, capturas y tiempos. Alternativa documental en el guion. No se publican datasets originales ni manuales. El curso, logística e identidad institucional requieren validación UTN. No hay resultados inventados.

## Actualizar
1. Editar `scripts/contenido.py`: fuente de diapositivas, guías, curso y referencias.
2. Con Python compatible, instalar python-docx y ejecutar `python scripts/documentos.py`. Con el runtime de artefactos y Sharp, ejecutar `node scripts/presentaciones.mjs`. Los validadores se encuentran en las rutas indicadas por el script; adaptar el entorno sin omitir revisión de geometría y fuentes.
3. Exportar DOCX y PPTX a PDF con LibreOffice. Revisar todas las páginas y las notas. Nunca sustituir procesamiento Pix4D por una imagen.
4. Ejecutar `python scripts/sitio.py`; revisar enlaces y móvil. Copiar `docs/` a la carpeta servida `docs/agroindustrial/` del repositorio.
5. Actualizar REFERENCIAS, CHANGELOG y verificación. Crear commit con mensaje concreto, publicar y comprobar HTTP 200 y descargas.

Los binarios editables pueden actualizarse directamente en PowerPoint/Word, pero se debe reconciliar la fuente para no perder cambios. Las fotografías y vistas mantienen los créditos de `assets/CREDITOS.md`. `LICENSE` no concede derechos sobre terceros.

## Identidad AGROINT

Se aplicaron el manual y los logotipos originales aportados. Fira Sans incluida en assets/fuentes con licencia OFL. Tras regenerar documentos, ejecutar scripts/marca_agroint.py antes de exportar. Decisiones y discrepancias del manual: assets/marca/APLICACION.md. La validación operativa de Pix4D continúa pendiente.
