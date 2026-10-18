"""Empaqueta fuentes y entregables sin dependencias ni datos de terceros."""
from pathlib import Path
import zipfile,hashlib,json
R=Path(__file__).resolve().parents[1]
files=[p for p in R.rglob('*') if p.is_file() and not any(x in p.parts for x in ['node_modules','__pycache__','.build','.git'])]
dest=R.parent/'UTN_Drones_Agricultura_entrega.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,Path(R.name)/p.relative_to(R))
print(dest,dest.stat().st_size)
groups={}
for p in files:
 data=p.read_bytes();sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 key=p.relative_to(R).as_posix()
 entry=groups.setdefault(sha,{'sha':sha,'file':str(p),'size':len(data),'paths':[]})
 entry['paths'].append(R.name+'/'+key)
 if key.startswith('docs/'):entry['paths'].append('docs/agroindustrial/'+key[5:])
 if p.suffix in ['.md','.py','.mjs','.html','.css','.js','.json','.csv','.txt'] or p.name=='LICENSE':entry['text']=data.decode()
(R.parent/'github-manifest.json').write_text(json.dumps(list(groups.values()),ensure_ascii=False))
print('Git objects',len(groups),'binary',sum('text' not in x for x in groups.values()))
