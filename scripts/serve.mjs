import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', process.argv.includes('--dist') ? 'dist' : '.');
const portArg = process.argv.indexOf('--port');
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT || 4175);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.webm':'video/webm','.mp4':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav' };
http.createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname === '/') pathname = '/index.html';
    if (!process.argv.includes('--dist')) {
      if (pathname.startsWith('/vendor/three/addons/')) pathname = pathname.replace('/vendor/three/addons/','/node_modules/three/examples/jsm/');
      else if (pathname.startsWith('/vendor/three/')) pathname = pathname.replace('/vendor/three/','/node_modules/three/build/');
      else if (/^\/(fonts\/|thumbnails\/|audio\/|favicon.svg)/.test(pathname)) pathname = '/public'+pathname;
    }
    const file = path.resolve(root,'.'+pathname);
    if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    const info = await stat(file);
    if (!info.isFile()) throw Error('Not a file');
    const content = await readFile(file);
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match){res.writeHead(416,{'Content-Range':`bytes */${content.length}`}).end();return;}
      const start=match[1]?Number(match[1]):Math.max(0,content.length-Number(match[2]));
      const end=match[1]&&match[2]?Math.min(Number(match[2]),content.length-1):content.length-1;
      if(start>end||start>=content.length){res.writeHead(416,{'Content-Range':`bytes */${content.length}`}).end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${content.length}`,'Content-Length':end-start+1});res.end(req.method==='HEAD'?undefined:content.subarray(start,end+1));
    }else{res.writeHead(200,{...headers,'Content-Length':content.length});res.end(req.method==='HEAD'?undefined:content);}
  } catch {res.writeHead(404).end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Bright Minds is ready at http://localhost:${port}`));
