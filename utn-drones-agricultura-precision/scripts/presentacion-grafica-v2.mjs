import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const R=path.resolve(import.meta.dirname,'..');
const O=path.join(R,'presentacion/graficos-v2');
const A=path.join(R,'assets');
const navy='#153749',teal='#008F8A',mint='#8FD5CA',ink='#203D4A',gray='#5B737B',pale='#EDF4F4',white='#FFFFFF',gold='#DAB055';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const old=JSON.parse(await fs.readFile(path.join(R,'presentacion/fuentes/contenido.json'),'utf8'));
const refs=JSON.parse(await fs.readFile(path.join(R,'investigacion/referencias.json'),'utf8'));
const manifests=JSON.parse(await fs.readFile(path.join(A,'capturas/graficos-v2/procedencia.json'),'utf8'));
let current,ci=0;const registry=[];
function rect(x,y,w,h,fill,stroke='none',lw=0,name='') {return current.shapes.add({geometry:'rect',name,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width:lw}});}
function txt(text,x,y,w,h=50,size=26,color=ink,bold=false,align='left') {let z=current.shapes.add({geometry:'textbox',name:text.slice(0,60),position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});z.text=text;z.text.style={fontSize:size,typeface:'Fira Sans',color,bold,alignment:align,verticalAlignment:'top',insets:0,autoFit:'none',wrap:'square'};return z;}
function line(x1,y1,x2,y2,color=teal,width=2){return pathShape([[x1,y1],[x2,y2]],'none',color,width);}
function pathShape(points,fill='none',stroke=teal,lw=2,closed=false){let xs=points.map(x=>x[0]),ys=points.map(x=>x[1]);let l=Math.min(...xs),t=Math.min(...ys),w=Math.max(1,Math.max(...xs)-l),h=Math.max(1,Math.max(...ys)-t);let cmds=points.map((q,i)=>i?{lineTo:{x:q[0]-l,y:q[1]-t}}:{moveTo:{x:q[0]-l,y:q[1]-t}});if(closed)cmds.push({close:{}});return current.shapes.add({geometry:'custom',position:{left:l,top:t,width:w,height:h},fill,line:{style:'solid',fill:stroke,width:lw},customPaths:[{width:w,height:h,commands:cmds}]});}
function circle(x,y,d,fill,stroke='none',lw=0){return current.shapes.add({geometry:'ellipse',position:{left:x,top:y,width:d,height:d},fill,line:{style:'solid',fill:stroke,width:lw}});}
function arrow(x,y,w,color=teal){line(x,y,x+w,y,color,2.5);pathShape([[x+w-9,y-6],[x+w,y],[x+w-9,y+6]],'none',color,2.5);}
async function img(file,x,y,w,h,fit='contain',crop=null){let full=path.join(A,file);let source=sharp(full,{animated:false});if(crop)source=source.extract(crop);source=source.resize({width:Math.ceil(w*1.8),height:Math.ceil(h*1.8),fit:fit==='cover'?'cover':'inside',withoutEnlargement:true});let photo=file.startsWith('fotografias/')||file.endsWith('matic100.jpg');let b=await(photo?source.jpeg({quality:94}):source.png()).toBuffer();current.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:photo?'image/jpeg':'image/png',alt:file,fit,position:{left:x,top:y,width:w,height:h}});registry.at(-1).assets.push(file);}
async function logo(dark=false){await img('marca/'+(dark?'logo_color_02_blanco.png':'logo_color_02.png'),1060,36,164,57);}
async function slide(n,title,dark=false){ci=n;current=p.slides.add();current.background.fill=dark?navy:white;registry.push({slide:n,title,assets:[],conceptual:[],sources:[]});if(title){txt(title,56,66,990,100,44,dark?white:navy,true);await logo(dark);}txt('UTN · Administración Agroindustrial',56,678,680,22,13,dark?'#BED2D7':gray);txt(String(n).padStart(2,'0'),1176,672,50,30,20,dark?mint:teal,true);return current;}
function cap(text,x=56,y=638,w=1168,dark=false){txt(text,x,y,w,30,13,dark?'#C7DADD':gray);}
function smallHeading(t,x,y,w=400,c=teal){txt(t,x,y,w,38,20,c,true);}
function note(extra='',sources=[]){const info=old[ci-1];let ids=info?.[7]||[];let urls=[...ids.map(id=>refs[id]).filter(Boolean),...sources];registry.at(-1).sources=[...new Set(urls)];current.speakerNotes.text=`Tiempo previsto: ${info?.[1]}–${info?.[2]} min. ${extra}\nFuentes: ${[...new Set(urls)].join('\n')}\nConsulta: 2026-10-20. Las vistas oficiales no acreditan ejecución local del software. Los esquemas conceptuales explican un método y no contienen mediciones ni clasificaciones calculadas. Los derechos de terceros permanecen con sus titulares.`;}
function concept(t){registry.at(-1).conceptual.push(t);}
function marker(n,x,y){circle(x,y,32,teal);txt(String(n),x,y+4,32,27,18,white,true,'center');}
function step(n,title,body,x,y,w=255,dark=false){txt(String(n).padStart(2,'0'),x,y,w,65,46,dark?mint:teal,true);txt(title,x,y+78,w,74,27,dark?white:navy,true);txt(body,x,y+164,w,95,24,dark?'#D4E4E7':gray);}

// 01. Portada: ortomosaico real, no imagen sintética.
await slide(1,'',true);await img('fotografias/campo-rgb.png',605,0,675,720,'cover');rect(0,0,605,720,navy);await img('marca/logo_color_02_blanco.png',56,44,190,66);txt('TALLER DEMOSTRATIVO',56,174,500,35,18,mint,true);txt('Drones y\nagricultura\nde precisión',56,232,530,250,62,white,true);txt('PIX4Dmatic Pro y PIX4Dfields',56,510,510,52,27,white);txt('Universidad Técnica Nacional\nAdministración Agroindustrial',56,585,510,66,22,'#D4E4E7');cap('Ortomosaico oficial. Courtesy of PIX4D / pix4d.com',650,669,570,true);note('Portada con ortomosaico RGB oficial Rostock. La imagen no es una fotografía generada. El logotipo AGROINT es original aportado.');

// 02. Diagrama de decisión original.
await slide(2,'El mapa responde a una decisión');
const st2=[['Problema','¿Qué necesita conocer\nla administración?'],['Producto','¿Qué información\ndebe entregar el mapa?'],['Comprobación','¿Cómo se revisará\nen campo?'],['Decisión','¿Quién actuará y\ncómo medirá el efecto?']];
for(let i=0;i<4;i++){let x=56+i*304;step(i+1,st2[i][0],st2[i][1],x,236,245);if(i<3)arrow(x+246,271,35);}
txt('Alcance: reconocer procesos, interpretar resultados y evaluar su utilidad.',56,579,1130,58,26,navy);concept('Secuencia de decisión: problema, producto, comprobación, decisión.');note('Introducir el propósito demostrativo. Pedir al grupo un problema de gestión que necesite información espacial.');

// 03. Aplicaciones con mapa real.
await slide(3,'Información para organizar la finca');await img('fotografias/campo-rgb.png',56,180,620,440,'cover');
const rows3=[['Superficie','Delimitación de lotes y áreas útiles.'],['Inventario','Registro de elementos visibles.'],['Monitoreo','Sectores que requieren inspección.'],['Insumos','Zonas para evaluar una intervención.']];
for(let i=0;i<4;i++){let y=188+i*108;smallHeading(rows3[i][0],730,y,475);txt(rows3[i][1],730,y+35,475,68,24,navy);if(i<3)line(730,y+92,1224,y+92,'#D6E3E5',1);}
cap('Vista real de ortomosaico RGB. Courtesy of PIX4D / pix4d.com');note('El ortomosaico ilustra la información visible. Las aplicaciones son propuestas de uso, no resultados agronómicos comprobados en este lote.');

// 04. Espectro original editable. Sin curvas de respuesta inventadas.
await slide(4,'RGB y multiespectral');const x0=90,x1=1180,yAxis=404;line(x0,yAxis,x1,yAxis,navy,2);const sx=nm=>x0+(nm-400)/500*(x1-x0);
for(let nm=400;nm<=900;nm+=100){line(sx(nm),yAxis-5,sx(nm),yAxis+10,navy,2);txt(String(nm),sx(nm)-32,426,70,30,19,gray,false,'center');}
txt('Longitud de onda (nm)',820,470,370,33,20,gray,false,'right');
rect(sx(400),222,sx(700)-sx(400),70,pale);txt('Luz visible: RGB',sx(400)+16,240,550,40,27,navy,true);txt('Infrarrojo cercano',sx(735),240,340,40,27,navy,true);
for(const [nm,label,c] of [[560,'G','#398C6C'],[650,'R','#BF5550'],[730,'RE','#8C5B85'],[860,'NIR',teal]]){rect(sx(nm)-20,325,40,78,c);txt(label,sx(nm)-55,305,110,28,20,c,true,'center');txt(String(nm),sx(nm)-50,364,100,30,19,white,true,'center');}
txt('RGB registra apariencia visible. Las bandas NIR y borde rojo permiten calcular índices específicos.',90,535,1090,75,29,navy);cap('Esquema espectral. Centros de banda del Mavic 3M según DJI; anchuras gráficas ilustrativas.');concept('Eje espectral de 400 a 900 nm. Centros de bandas M3M 560, 650, 730, 860 nm.');note('Diagrama conceptual. Los bloques indican centros, no el ancho de banda ni curvas de respuesta. RGB no aporta la banda NIR ni borde rojo.',['https://ag.dji.com/mavic-3-m/specs']);

// 05. Foto documentada del equipo y datos claros.
await slide(5,'DJI Mavic 3 Multispectral');await img('fotografias/mavic3m.jpg',56,184,740,430,'contain');
txt('20 MP',845,193,360,80,58,navy,true);txt('Cámara RGB',845,274,350,40,25,gray);line(845,332,1220,332,'#D6E3E5',1);txt('4 × 5 MP',845,356,360,80,58,teal,true);txt('Verde, rojo, borde rojo\ne infrarrojo cercano',845,438,370,82,25,navy);txt('RTK y sensor de luz solar',845,555,370,68,23,gray);cap('Fotografía de ZLEA, CC BY-SA 4.0. Especificaciones: DJI.');note('Fotografía real de un Mavic 3M en exhibición. No atribuir precisión final al RTK sin comprobación independiente.',['https://ag.dji.com/mavic-3-m/specs']);

// 06. Diagrama original de cobertura, solape y control.
await slide(6,'Planificación de la captura');rect(64,190,750,421,pale);pathShape([[108,248],[710,210],[770,540],[147,582]],'#DCEAE5',navy,2,true);
for(let col=0;col<4;col++){let x=208+col*146;for(let j=0;j<5;j++)rect(x-80,251+j*56,180,94,'#FFFFFF/24','#789F98',1);}
const route=[];for(let col=0;col<4;col++){let x=208+col*146;if(col%2===0)route.push([x,248],[x,552]);else route.push([x,552],[x,248]);}pathShape(route,'none',teal,4);
for(const [x,y] of [[148,287],[708,270],[191,526],[698,515]]){circle(x-7,y-7,14,navy);line(x-12,y,x+12,y,white,1.4);line(x,y-12,x,y+12,white,1.4);}
smallHeading('Cobertura',861,204,340);txt('Límites y líneas de vuelo.',861,242,345,64,25);smallHeading('Detalle',861,327,340);txt('Resolución según el objetivo.',861,365,345,72,25);smallHeading('Control',861,460,340);txt('Solape, iluminación\ny referencias de campo.',861,498,345,90,25);cap('Diagrama conceptual de misión. Sin altura, solape ni exactitud asignados.');concept('Plano de vuelo con fotografías superpuestas y puntos de control.');note('Explicar cobertura de imágenes sin fijar parámetros universales. Revisar seguridad y permisos aplicables antes de una misión real.');

// 07. Diagrama de productos.
await slide(7,'Procesamiento fotogramétrico',true);
const stages=[['Fotografías','Captura organizada'],['Calibración','Cámaras y ajuste'],['Nube de puntos','Geometría 3D'],['DSM y ortomosaico','Superficie y cartografía']];
for(let i=0;i<4;i++){let x=56+i*304;txt('0'+(i+1),x,228,240,70,52,mint,true);line(x,329,x+240,329,mint,2);txt(stages[i][0],x,359,250,86,29,white,true);txt(stages[i][1],x,461,250,70,22,'#D4E4E7');if(i<3)arrow(x+247,328,34,mint);}
txt('Revisión de calidad y coordenadas antes de medir o exportar.',56,585,1130,52,28,white);concept('Flujo de procesamiento con control transversal de calidad.');note('Matic Pro demuestra el procesamiento RGB. Utilizar resultados preparados para respetar los 30 minutos asignados.');

// 08. Captura verificable y detalles del control.
await slide(8,'Calibración y control del proyecto');await img('capturas/graficos-v2/matic-19.png',56,181,827,438,'contain');await img('capturas/graficos-v2/matic-29.png',913,181,195,426,'contain');
cap('Capturas oficiales de la guía de PIX4Dmatic. El panel identifica la versión 2.4.0.');note('Captura pública de importación de puntos y panel de calibración. No representa Pro instalado ni una ejecución local. Revisar imágenes, CRS, control, cámaras calibradas y reporte.',['https://support.pix4d.com/hc/en-us/articles/11188127036957']);

// 09. Geometría real y explicación breve.
await slide(9,'Nube de puntos y modelo 3D',true);await img('capturas/matic100.jpg',52,172,832,440,'contain');
smallHeading('Nube de puntos',916,198,310,mint);txt('Posiciones 3D de las\nsuperficies reconstruidas.',916,240,310,110,25,white);smallHeading('Malla',916,390,310,mint);txt('Superficie formada\npor caras conectadas.',916,432,310,110,25,white);cap('Vista oficial de nube y cámaras. Courtesy of PIX4D / pix4d.com',56,638,1168,true);note('La imagen muestra nube y posiciones de cámaras del ejemplo oficial de 100 imágenes. No presentar esta imagen como una malla ni como resultado local. Mostrar en software una malla solo si existe en el proyecto ejecutado.');

// 10. Comparación documentada del informe de calidad.
await slide(10,'Ortomosaico y DSM');smallHeading('ORTOMOSAICO',56,166,540);smallHeading('DSM',663,166,560);await img('capturas/graficos-v2/report-47.png',56,210,548,370,'contain');await img('capturas/graficos-v2/report-46.png',663,210,550,370,'contain');txt('Posición y apariencia en planta',56,589,548,39,25,navy,true);txt('Elevación de la superficie visible',663,589,550,39,25,navy,true);cap('Ejemplos oficiales del informe de calidad de PIX4Dmatic. Se conservan sus leyendas.');note('Vistas reales publicadas en el artículo Quality report. Su contexto es urbano y se usa para explicar los productos. El DSM incluye objetos y vegetación. La altura de cultivo requiere una referencia de terreno compatible.',['https://support.pix4d.com/hc/en-us/articles/360040686852']);

// 11. Interoperabilidad original.
await slide(11,'Interoperabilidad');
const outs=[['Ortomosaico','GeoTIFF','Cartografía en SIG'],['Modelo de superficie','GeoTIFF','Análisis de elevación'],['Nube de puntos','LAZ','Geometría 3D en SIG / CAD']];
for(let i=0;i<3;i++){let y=208+i*102;txt(outs[i][0],56,y,360,50,28,navy,true);arrow(435,y+20,70);txt(outs[i][1],544,y,180,48,28,teal,true);arrow(733,y+20,72);txt(outs[i][2],845,y,370,63,26,navy);line(56,y+76,1224,y+76,'#D6E3E5',1);}
rect(56,553,1168,62,pale);txt('NDVI y NDRE requieren las bandas multiespectrales correspondientes.',77,569,1120,40,25,navy);cap('Esquema de intercambio. Conservar sistema de coordenadas, unidades y procedencia.');concept('Rutas de exportación por producto, formato y destino.');note('GeoTIFF RGB no contiene NIR ni borde rojo. El proyecto Matic RGB y el proyecto Fields multiespectral son flujos distintos.',['https://support.pix4d.com/hc/en-us/articles/360044950312']);

// 12. Vista de software real, con orientación lateral.
await slide(12,'PIX4Dfields: análisis del lote');await img('capturas/fields-estadisticas.png',56,190,850,418,'contain');
smallHeading('Unidades de manejo',944,207,280);txt('Límites del campo\ny parcelas.',944,251,280,83,25);smallHeading('Capas',944,365,280);txt('Ortomosaico, índices\ny estadísticas.',944,409,280,95,25);cap('Captura oficial de estadísticas. Courtesy of PIX4D / pix4d.com');note('La captura procede de Exporting statistics. Es un ejemplo oficial independiente, distinto del ensayo Field trial del workbook. No afirmar procesamiento local.',['https://support.pix4d.com/hc/en-us/articles/4409231699345']);

// 13. Fórmulas y pares de bandas, todo editable.
await slide(13,'NDVI y NDRE',true);
const formulas=[['NDVI','(NIR − Rojo) / (NIR + Rojo)','Rojo','NIR'],['NDRE','(NIR − Borde rojo) / (NIR + Borde rojo)','Borde rojo','NIR']];
for(let i=0;i<2;i++){let y=210+i*198;txt(formulas[i][0],56,y,210,62,44,mint,true);txt(formulas[i][1],288,y+10,925,64,32,white,true);line(288,y+89,1215,y+89,'#557783',1);rect(290,y+111,230,36,i?'#8C5B85':'#BF5550');txt(formulas[i][2],300,y+116,210,30,19,white,true);rect(538,y+111,230,36,teal);txt('Infrarrojo cercano',548,y+116,215,30,19,white,true);}
txt('Índices sin unidades. La interpretación depende del cultivo y de la captura.',56,618,1150,49,25,white);concept('Comparación de fórmulas y bandas usadas por NDVI y NDRE.');note('Enmascarar NoData y denominador cero. No convertir índices directamente en dosis o diagnósticos.',['https://support.pix4d.com/hc/en-us/articles/360000891623']);

// 14. Datos reales de estadísticas sin atribuirlos al ensayo distinto.
await slide(14,'Estadísticas por parcela');await img('capturas/graficos-v2/stats-07.png',56,225,1168,235,'contain');
const s14=[['Identificador','Relaciona cada fila con una parcela.'],['Media del índice','Resume los píxeles de esa parcela.'],['Superficie','Permite revisar la unidad de análisis.']];
for(let i=0;i<3;i++){let x=56+i*405;smallHeading(s14[i][0],x,492,360);txt(s14[i][1],x,533,360,76,24);}
cap('Tabla real del ejemplo oficial de estadísticas. Es un caso distinto del ensayo Field trial.');note('Esta tabla corresponde al ejemplo público de Exporting statistics. No mezclar sus valores con el ensayo alemán del workbook. En la demostración de Field trial se mostrarán exclusivamente estadísticas obtenidas de ese proyecto cuando estén disponibles.',['https://support.pix4d.com/hc/en-us/articles/4409231699345']);

// 15. Comparación real RGB / NDVI del mismo ejemplo y verificación.
await slide(15,'Interpretación y validación');await img('capturas/graficos-v2/wheat-12.png',56,211,660,375,'contain');
const check=[['Observación','Diferencia visible en el mapa.'],['Hipótesis','Cobertura, sombra o condición del cultivo.'],['Verificación','Inspección y registro en campo.']];
for(let i=0;i<3;i++){let y=195+i*137;marker(i+1,767,y+3);txt(check[i][0],818,y,400,40,27,navy,true);txt(check[i][1],818,y+47,400,75,24);}
cap('Comparación RGB / NDVI del ejemplo oficial de trigo. Courtesy of PIX4D / pix4d.com');note('La comparación procede de My first vegetation index map. No es Field trial. La imagen muestra la importancia del suelo visible. No inferir una causa agronómica específica sin comprobación.',['https://support.pix4d.com/hc/en-us/articles/16997255586589']);

// 16. Caso del manual: descripción verificada, sin copiar su cartografía.
await slide(16,'Malezas en pasturas');txt('Zarzamora en pastura australiana',56,176,1140,55,30,navy,true);
const ca=[['Ortomosaico RGB','Identificación visual\ndel objetivo.'],['Wanted','Celdas con\nzarzamora.'],['Not wanted','Pasto y elementos\nque deben excluirse.'],['Revisión','Corrección de errores\nantes de intervenir.']];
for(let i=0;i<4;i++){let x=56+i*304;step(i+1,ca[i][0],ca[i][1],x,284,246);if(i<3)arrow(x+246,321,34);}
cap('Diagrama del caso Targeted Operations, PIX4Dfields Essentials. No representa una detección calculada.');concept('Secuencia de selección de zarzamora a partir del caso oficial Targeted Operations.');note('Caso verificado en PIX4Dfields Essentials Course Workbook 2024: Australian sheep pasture, XAG M500 RGB, 254 imágenes, 60 m de vuelo. No se reproducen imágenes del cuaderno. El diagrama original describe su procedimiento. El Mavic 3M es equipo de referencia del taller, no el equipo de este caso.');

// 17. Capturas legibles y proceso de revisión.
await slide(17,'Magic Tool');
await img('capturas/graficos-v2/magic-07.png',65,179,280,405,'contain');await img('capturas/graficos-v2/magic-08.png',450,179,280,405,'contain');arrow(362,386,64);
smallHeading('Selección asistida',842,210,375);txt('Wanted: objetivo buscado.\nNot wanted: elementos\nque deben excluirse.',842,255,375,132,25);smallHeading('Revisión manual',842,427,375);txt('Añadir omisiones.\nEliminar falsos positivos.',842,472,375,98,25);cap('Controles oficiales de Magic Tool. La selección necesita revisión.');note('Wanted se refiere a lo que se desea seleccionar y puede representar una maleza. Las capturas son controles oficiales de la herramienta, sin afirmar que corresponden a la ejecución de zarzamora.',['https://support.pix4d.com/hc/en-us/articles/7886486253213']);

// 18. Mapa conceptual de operación, sin dosis.
await slide(18,'Mapa de operación agrícola');const gx=78,gy=203,cw=58,ch=43,cols=12,rows=8;rect(gx-8,gy-8,cw*cols+16,ch*rows+16,pale);
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let select=(i>=2&&i<=4&&j>=2&&j<=5)||(i>=8&&i<=9&&j>=1&&j<=3)||(i>=6&&i<=7&&j>=6);let exclude=(i===6||i===7)&&(j===3||j===4);rect(gx+i*cw,gy+j*ch,cw-2,ch-2,exclude?'#D8DEE0':select?teal:'#F6F9F9','#C2D4D7',.6);if(exclude){line(gx+i*cw+8,gy+j*ch+8,gx+(i+1)*cw-10,gy+(j+1)*ch-10,gray,1.5);line(gx+i*cw+8,gy+(j+1)*ch-10,gx+(i+1)*cw-10,gy+j*ch+8,gray,1.5);}}
rect(gx-2,gy-2,cw*cols+2,ch*rows+2,'none',navy,2.5);smallHeading('Actuación',860,215,350);rect(860,260,26,26,teal);txt('Celdas seleccionadas',904,255,310,50,25);smallHeading('Exclusión',860,343,350);rect(860,389,26,26,'#D8DEE0',gray,1);txt('Obstáculos y restricciones',904,383,310,70,25);txt('Formato y compatibilidad\ndel equipo receptor.',860,499,350,92,25,navy,true);cap('Esquema conceptual. Sin coordenadas, dosis ni archivo de aplicación para maquinaria.');concept('Cuadrícula de actuación y exclusión, sin valores agronómicos.');note('El esquema solo explica la estructura de un mapa de operación. No corresponde a ningún lote ni prescribe agroquímicos. Verificar terminal, formato, límites, celdas y obstáculos en una aplicación real.');

// 19. Decisión empresarial, esquema editable.
await slide(19,'Evaluación del servicio');
const flows=[['Necesidad','Problema y superficie\nque se deben evaluar.'],['Costo total','Captura, procesamiento,\nlicencias y validación.'],['Utilidad','Cambio en la prioridad\no decisión de manejo.'],['Seguimiento','Registro del efecto\ny revisión del resultado.']];
for(let i=0;i<4;i++){let x=56+i*304;step(i+1,flows[i][0],flows[i][1],x,225,247);if(i<3)arrow(x+247,261,33);}
line(56,565,1224,565,teal,2);txt('El beneficio se comprueba con registros de la operación.',56,594,1150,58,30,navy,true);concept('Evaluación del servicio desde necesidad hasta seguimiento de resultado.');note('Evitar porcentajes de ahorro o productividad sin evidencia. Debatir costos y utilidad de la información para Administración Agroindustrial.');

// 20. Programa de 40 h: distribución exacta de la propuesta existente.
await slide(20,'Propuesta de curso formal');txt('40',56,205,230,134,102,navy,true);txt('HORAS PROPUESTAS',56,350,300,35,20,teal,true);txt('Drones y tecnologías\ngeoespaciales aplicadas\na la agroindustria',56,426,330,142,28,navy,true);
const mods=[['Fundamentos y sensores',6],['Planificación y captura',6],['PIX4Dmatic Pro',10],['PIX4Dfields',12],['Proyecto aplicado',6]];
for(let i=0;i<5;i++){let y=192+i*84;txt(mods[i][0],470,y,520,32,23,navy,true);rect(470,y+42,mods[i][1]*48,15,i%2?navy:teal);txt(mods[i][1]+' h',1095,y+17,125,37,27,teal,true,'right');}
cap('Distribución preliminar de la propuesta académica. Requiere revisión y aprobación de la UTN.');concept('Diagrama proporcional de duración por módulo: 6, 6, 10, 12 y 6 horas. Total 40 h.');note('Horas según propuesta ya elaborada en el repositorio: 10 teoría y 30 práctica. No anunciar aprobación UTN. La apertura necesita validación académica, licencias, laboratorio y práctica de campo.');

// 21. Pregunta final y síntesis gráfica de decisión.
await slide(21,'Aplicación agroindustrial',true);txt('¿Qué decisión necesita\nun mapa?',56,209,1140,180,65,white,true);line(56,424,1224,424,mint,2);
const last=[['Problema','Necesidad concreta'],['Producto','Información requerida'],['Validación','Evidencia de campo'],['Indicador','Resultado que se medirá']];for(let i=0;i<4;i++){let x=56+i*304;txt(last[i][0],x,476,265,45,28,mint,true);txt(last[i][1],x,538,265,74,23,white);}
concept('Síntesis de aplicación: problema, producto, validación e indicador.');note('Solicitar una respuesta breve y relacionarla con uno de los productos demostrados. No incluir un QR a recursos hasta verificar que el enlace contiene las descargas actualizadas.');

await fs.mkdir(path.join(O,'laminas'),{recursive:true});await fs.mkdir(path.join(O,'pdf-paginas'),{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 let s=p.slides.items[i],stem=`diapositiva-${String(i+1).padStart(2,'0')}`;
 const png=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(path.join(O,'laminas',stem+'.png'),new Uint8Array(await png.arrayBuffer()));

 console.log(stem);
}
await (await PresentationFile.exportPptx(p)).save(path.join(R,'presentacion/pptx/UTN_Drones_Agricultura_Grafica_v2.pptx'));
await fs.writeFile(path.join(O,'registro-grafico.json'),JSON.stringify(registry,null,2));
console.log('PPTX terminado');
