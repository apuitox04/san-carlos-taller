import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation} from '/root/.codex/skills/builtins/presentations/container_tools/artifact_tool_utils.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'), WORK=path.dirname(ROOT),QA=path.join(WORK,'qa');
const navy='#264C6E',teal='#00918C',aqua='#DAB055',pale='#F5F5F5',ink='#263B48';
const slides=JSON.parse(await fs.readFile(path.join(ROOT,'presentacion/fuentes/contenido.json'),'utf8'));
const imgs={};
async function image(s,file,x,y,w,h,fit='contain'){
 if(!imgs[file])imgs[file]=await sharp(path.join(ROOT,'assets',file)).resize({width:1600,height:1300,fit:'inside',withoutEnlargement:true}).jpeg({quality:88}).toBuffer();
 let b=imgs[file];s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/jpeg',alt:file,fit,position:{left:x,top:y,width:w,height:h}});
}
function box(s,x,y,w,h,fill){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}})}
function txt(s,text,x,y,w,h,size=28,color=ink,bold=false){let z=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});z.text=text;z.text.style={fontSize:size,typeface:'Fira Sans',color:color===teal&&size<24?navy:color,bold,verticalAlignment:'top',alignment:'left',wrap:'square',autoFit:'none',insets:0};return z;}
async function logo(s,x,y,w,white=false){const b=await fs.readFile(path.join(ROOT,'assets/marca',white?'logo_color_02_blanco.png':'logo_color_02.png'));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'Logotipo original de AGROINT',fit:'contain',position:{left:x,top:y,width:w,height:w*692/2000}});}
function footer(s,n,refs,dark=false){txt(s,`UTN · Administración Agroindustrial  |  ${refs.join(' · ')}`,56,676,1080,23,14,dark?'#D1E0E6':'#506B78');txt(s,String(n).padStart(2,'0'),1170,673,55,28,18,dark?aqua:teal,true);}
function lines(s,items,x,y,w,size=28,gap=104,color=ink){items.forEach((t,i)=>{txt(s,String(i+1).padStart(2,'0'),x,y+i*gap,46,40,17,teal,true);txt(s,t,x+64,y+i*gap,w-64,gap-12,size,color);});}
async function finish(p,name,dir,w,h,count){
 const stamp=Date.now()+'-'+name, temp=path.join(WORK,'.build',stamp);await fs.mkdir(temp,{recursive:true});await fs.mkdir(QA,{recursive:true});
 let candidate=path.join(temp,'candidate.pptx'),final=path.join(temp,name+'.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
 const tools='/root/.codex/skills/builtins/presentations/container_tools';
 await finalizePresentation({workspaceDir:WORK,candidatePath:candidate,finalPath:final,receiptPath:path.join(QA,stamp+'.json'),integrityValidatorPath:tools+'/inspect_presentation_package_integrity.py',layoutValidatorPath:tools+'/inspect_presentation_layout_geometry.py',pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,fontPolicy:{basis:'user_request',families:['Fira Sans']},verifyArtifactToolImport:true,explicitTotalSlideCount:count,layoutArgs:['--expected-slide-size-emu',`${Math.round(w*9525)},${Math.round(h*9525)}`,'--validate-bullet-geometry','--validate-heading-fit']});
 await fs.copyFile(final,path.join(ROOT,dir,name+'.pptx'));
 console.log('Validado',name);
}
const p=Presentation.create({slideSize:{width:1280,height:720}});
for(const [n,start,end,title,items,kind,img,refs] of slides){
 const s=p.slides.add();let dark=['portada','oscuro'].includes(kind);s.background.fill=dark?navy:'#FFFFFF';
 if(kind==='portada'){
   await image(s,img,720,0,560,650,'cover');box(s,0,0,720,650,navy);await logo(s,60,60,240,true);
   txt(s,'TALLER DEMOSTRATIVO · 120 MIN',60,207,600,36,18,aqua,true);
   txt(s,title,60,263,615,175,62,'#FFFFFF',true);txt(s,items[0],60,455,600,83,28,'#FFFFFF');txt(s,items.slice(1).join('\n'),60,565,600,65,22,'#FFFFFF');
 }else{
   await logo(s,1020,60,200,dark);
   txt(s,`${start}–${end} MIN  /  ${n<7?'CAPTURA':n<12?'FOTOGRAMETRÍA':n<16?'ÍNDICES':n<19?'MALEZAS':'GESTIÓN'}`,56,36,880,32,16,dark?aqua:navy,true);
   txt(s,title,56,90,880,100,46,dark?'#FFFFFF':navy,true);
   if(kind==='foto'){
     lines(s,items,56,232,540,27,118);await image(s,img,650,205,574,380);txt(s,img.includes('mavic')?'Foto ZLEA · CC BY-SA 4.0':'Vista oficial · Courtesy of Pix4D / pix4d.com',650,604,574,48,14,teal);
   }else if(kind==='oscuro'){
     items.forEach((t,i)=>{txt(s,t,72,233+i*115,1110,95,33,'#FFFFFF');});
     if(n===21)txt(s,'agroint.co.cr',72,607,1000,42,28,aqua,true);
   }else if(kind==='flujo'){
     items.forEach((t,i)=>{let x=56+i*298;box(s,x,250,274,190,i===3?navy:pale);txt(s,'0'+(i+1),x+23,275,228,35,20,i===3?aqua:teal,true);txt(s,t,x+23,327,228,82,29,i===3?'#FFFFFF':navy,true);});
     txt(s,'Cada salida exige comprobar su procedencia y calidad.',56,505,1140,65,30,navy);txt(s,'Diagrama original · flujo conceptual',56,603,1100,30,16,teal);
   }else if(kind==='bandas'){
     const labels=['RGB','G','R','RE','NIR'];labels.forEach((t,i)=>{box(s,56+i*238,225,214,105,[navy,'#387A58','#A94742','#9C536C','#554F85'][i]);txt(s,t,78+i*238,257,180,53,34,'#FFFFFF',true);});lines(s,items,56,390,1150,27,80);
   }else if(kind==='nube'){
     await image(s,'capturas/matic100.jpg',56,213,650,370);lines(s,items,762,225,460,25,124);txt(s,'Vista oficial de nube y cámaras · Courtesy of Pix4D / pix4d.com',56,607,1120,35,15,teal);
   }else if(kind==='indices'){
     box(s,56,220,1168,230,pale);txt(s,items[0],88,250,1100,67,37,navy,true);txt(s,items[1],88,348,1100,67,37,navy,true);txt(s,items[2],56,500,1150,85,28,ink);txt(s,'Enmascarar denominador cero y NoData. RGB no aporta NIR ni Red Edge.',56,604,1168,37,20,teal);
   }else if(kind==='parcelas'){
     box(s,56,215,565,350,pale);for(let j=0;j<3;j++)for(let i=0;i<5;i++){box(s,80+i*104,245+j*94,88,72,['#D8E8B1','#BCDCA8','#83B99D','#5B9D91'][(i+j)%4]);txt(s,String(j*5+i+1),90+i*104,267+j*94,68,32,20,navy,true);}
     txt(s,'Esquema original de parcelas. Sin valores ni resultados.',56,590,565,60,17,teal);lines(s,items,690,225,530,26,120);
   }else if(kind==='magic'){
     box(s,56,215,565,350,pale);for(let j=0;j<5;j++)for(let i=0;i<8;i++)box(s,77+i*65,236+j*60,57,51,((i*3+j*7)%9<3)?teal:'#D1DFD9');txt(s,'Wanted / objeto buscado',80,570,510,32,20,teal,true);txt(s,'Cuadrícula conceptual. No es una detección calculada.',56,616,610,30,16,teal);lines(s,items,690,215,530,26,98);
   }else if(kind==='comparacion'){
     for(let i=0;i<2;i++){let x=56+i*598;box(s,x,220,570,235,pale);txt(s,i?'DSM':'ORTOMOSAICO',x+25,249,520,40,24,teal,true);txt(s,items[i],x+25,312,520,110,31,navy);}
     txt(s,items[2],56,510,1140,90,29,navy);
   }else if(kind==='curso'){
     box(s,56,220,285,370,navy);txt(s,'40',86,250,230,130,96,aqua,true);txt(s,'HORAS\nPROPUESTAS',86,406,230,90,27,'#FFFFFF',true);lines(s,[items[0],items[2],items[3]],410,230,810,28,125);
   }else lines(s,items,56,223,1140,30,items.length===4?99:122);
 }
 footer(s,n,refs,dark);s.speakerNotes.text=`Tiempo ${start}–${end} min. Idea: ${title.replaceAll('\n',' ')}. ${items.join(' ')}\nFuentes: ${refs.join(', ')}; URLs en REFERENCIAS.md. Seguir Guion_instructor y guías D/E1/E2. Vistas Pix4D oficiales; esquemas son conceptuales. Los proyectos nativos y exportaciones requieren ejecución y ensayo previo. No atribuir los esquemas a resultados reales.`;
 await fs.writeFile(path.join(QA,`slide-${String(n).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
}
await finish(p,'UTN_Drones_Agricultura','presentacion/pptx',1280,720,21);

for(const [name,w,h,scale] of [['Afiche_A4',793.7007874,1122.519685,3.125],['Afiche_redes',1080,1080,1],['Afiche_historia',1080,1920,1]]){
 const a=Presentation.create({slideSize:{width:w,height:h}}),s=a.slides.add();s.background.fill='#FFFFFF';let square=h===w, k=w/794,hero=square?520:h*.49, margin=60;
 box(s,0,0,w,hero,navy);await image(s,'fotografias/campo-rgb.png',w*.63,0,w*.37,hero,'cover');box(s,0,0,w*.63,hero,navy);
 await logo(s,margin,60,square?280:240*k,true);
 txt(s,'Drones y\nagricultura\nde precisión',margin,square?235:215*k,w*.59-margin,235*k,square?65:52*k,'#FFFFFF',true);
 await image(s,'fotografias/mavic3m.jpg',w*.67,hero*.6,w*.29,hero*.3,'contain');
 let y=hero+25;txt(s,'Demostración de PIX4Dmatic Pro\ny PIX4Dfields',margin,y,w-2*margin,square?78:66*k,square?34:28*k,navy,true);y+=square?90:83*k;
 txt(s,'Universidad Técnica Nacional · Administración Agroindustrial',margin,y,w-2*margin,48,square?22:19*k,ink);y+=square?49:49*k;
 txt(s,'2 HORAS  ·  MODALIDAD DEMOSTRATIVA',margin,y,w-2*margin,32*k,square?22:19*k,navy,true);y+=square?45:45*k;
 txt(s,'Drones agrícolas · Fotogrametría\nÍndices de vegetación · Detección de malezas',margin,y,w-2*margin,60*k,square?24:20*k,ink);y+=square?76:72*k;
 const labels=['Fecha','Hora','Lugar','Inscripción','Expositor'];
 if(square){labels.forEach((l,i)=>txt(s,l+': por confirmar',margin+(i%2)*w*.46,y+Math.floor(i/2)*38,w*.43,32,21,navy));}
 else{labels.forEach((l,i)=>{box(s,margin,y+i*38*k,w-2*margin,30*k,pale);txt(s,l+': por confirmar',margin+10,y+3*k+i*38*k,w-2*margin-20,28*k,18*k,navy);});}
 txt(s,'Actividad propuesta · Datos logísticos por confirmar.',margin,h-75,w-2*margin,26,14,navy);
 txt(s,'Foto ZLEA · CC BY-SA 4.0. Vista agrícola: Courtesy of Pix4D / pix4d.com',margin,h-39,w-2*margin,25,11,ink);
 s.speakerNotes.text='Identidad AGROINT según libro de marca y logotipos originales aportados. Campos logísticos editables. Sin logotipo UTN. Confirmar logística. Créditos y derechos en assets/CREDITOS.md.';
 await fs.writeFile(path.join(ROOT,'afiche/exportaciones',name+'.png'),new Uint8Array(await(await a.export({slide:s,format:'png',scale})).arrayBuffer()));
 await finish(a,name,'afiche/editable',w,h,1);
}
