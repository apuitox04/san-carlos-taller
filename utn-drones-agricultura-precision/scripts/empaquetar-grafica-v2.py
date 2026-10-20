from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO
import json,zipfile,shutil,hashlib
R=Path(__file__).resolve().parents[1]
O=R/'presentacion/graficos-v2'
pdf=R/'presentacion/pdf/UTN_Drones_Agricultura_Grafica_v2.pdf'
c=canvas.Canvas(str(pdf),pagesize=(960,540),pageCompression=1)
c.setTitle('Drones y agricultura de precisión — presentación gráfica v2')
c.setAuthor('Andrés Castillo Leitón')
# PDF de distribución: imagen fiel de cada diapositiva a 1920 × 1080.
for p in sorted((O/'laminas').glob('*.png')):
 im=Image.open(p).convert('RGB');b=BytesIO();im.save(b,format='JPEG',quality=96,subsampling=0);b.seek(0)
 c.drawImage(ImageReader(b),0,0,width=960,height=540)
 # Atribución enlazada según las condiciones del conjunto oficial.
 c.linkURL('https://www.pix4d.com/',(42,34,918,67),relative=0,thickness=0)
 c.showPage()
c.save()
# Vista de seis láminas para revisión.
nums=[4,6,9,10,13,18];sheet=Image.new('RGB',(1280,1080),'white')
for i,n in enumerate(nums):
 im=Image.open(O/'laminas'/f'diapositiva-{n:02}.png').convert('RGB');im=im.resize((640,360),Image.Resampling.LANCZOS);sheet.paste(im,(i%2*640,i//2*360))
sheet.save(O/'Vista_previa_grafica_v2.jpg',quality=94)
# Paquete de gráficos en tamaño de presentación. Las fuentes editables están en PPTX.
z=R/'presentacion/Graficos_Presentacion_UTN_v2.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as out:
 for p in sorted((O/'laminas').glob('*.png')):out.write(p,'laminas/'+p.name)
 for p in [O/'README.md',O/'registro-grafico.json',R/'assets/CREDITOS.md',R/'REFERENCIAS.md',R/'scripts/presentacion-grafica-v2.mjs']:
  if p.exists():out.write(p,'fuentes/'+p.name)
 out.write(O/'Vista_previa_grafica_v2.jpg','Vista_previa_grafica_v2.jpg')
for p in [pdf,z]:print(p,p.stat().st_size)
