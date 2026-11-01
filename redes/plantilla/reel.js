// Reel animado (1080x1920, 9:16) con la misma identidad que la placa.
// Uso: node reel.js '<json>' salida.mp4
// json: igual que placa.js {"theme":"light|dark|celeste","tag":"TEMA","head":"Frase con <em>énfasis</em>","sub":"Línea de apoyo"}
// Opcionales: "size" (tamaño de la frase, def. 116), "dur" (segundos, def. 12),
//             "music" (ruta a .wav/.mp3; si falta, genera una pista original con musica.py), "mood" (calido|epico|reflexivo)
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const os = require('os');
const { execFileSync } = require('child_process');
const c = JSON.parse(process.argv[2]); const out = path.resolve(process.argv[3]);
const FPS = 30, DUR = c.dur || 12, N = Math.round(FPS * DUR);
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'logo41.jpg')).toString('base64');
const themes = {
  light:  { bg:'#F6F4EF', ink:'#14213D', accent:'#4A90C8', sub:'#3E4A61', rule:'#14213D', em:'#4A90C8' },
  dark:   { bg:'#14213D', ink:'#FFFFFF', accent:'#8CC4EC', sub:'#C9D3E3', rule:'#8CC4EC', em:'#8CC4EC' },
  celeste:{ bg:'#BFDDF2', ink:'#0F1B33', accent:'#FFFFFF', sub:'#22324F', rule:'#0F1B33', em:'#0F1B33', emBg:'#fff' },
};
const t = themes[c.theme] || themes.light;
const html = `<!DOCTYPE html><html><head><style>
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${t.bg};font-family:'Inter',sans-serif;color:${t.ink};position:relative;overflow:hidden}
.q{position:absolute;right:60px;top:290px;font-family:'DejaVu Serif',serif;font-size:520px;line-height:1;color:${t.accent};opacity:.35}
.bar{position:absolute;left:96px;top:550px;height:16px;background:${t.accent};width:0}
.tag{position:absolute;left:96px;top:598px;font-size:34px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:${t.sub}}
h1{position:absolute;left:96px;right:96px;top:720px;font-family:'Inter Display','Inter',sans-serif;font-weight:800;font-size:${c.size||116}px;line-height:1.07;letter-spacing:-.02em}
h1 .w{display:inline-block;will-change:transform,opacity}
h1 em{font-style:normal;color:${t.em};${t.emBg?`background:linear-gradient(${t.emBg},${t.emBg}) no-repeat left/0% 100%;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 14px;`:''}}
p{position:absolute;left:96px;right:140px;font-size:46px;line-height:1.35;color:${t.sub}}
.foot{position:absolute;left:96px;right:96px;bottom:300px;border-top:3px solid ${t.rule};padding-top:34px;display:flex;align-items:center;gap:30px}
.logo{width:132px;height:132px;border-radius:50%;object-fit:cover;flex:none}
.who{display:flex;flex-direction:column;gap:6px}
.name{font-family:'Inter Display','Inter',sans-serif;font-weight:700;font-size:48px;line-height:1.1}
.role{font-size:32px;color:${t.sub};font-weight:500}
.place{margin-left:auto;font-size:28px;color:${t.sub};letter-spacing:.06em;align-self:flex-end;padding-bottom:6px}
</style></head><body>
<div class="q">“</div><div class="bar"></div><div class="tag">${c.tag}</div>
<h1>${c.head}</h1><p>${c.sub}</p>
<div class="foot"><img class="logo" src="${logo}"><div class="who"><span class="name">Esteban Arosteguy</span><span class="role">Edil (S) · Partido Nacional</span></div><span class="place">San José</span></div>
<script>
// separar la frase en palabras animables, respetando <em>
const h1=document.querySelector('h1');
(function wrap(node){[...node.childNodes].forEach(n=>{
  if(n.nodeType===3){const f=document.createDocumentFragment();
    n.textContent.split(/(\\s+)/).forEach(s=>{if(!s)return; if(/^\\s+$/.test(s)){f.appendChild(document.createTextNode(s));return}
      const sp=document.createElement('span');sp.className='w';sp.textContent=s;f.appendChild(sp)});
    n.replaceWith(f)} else wrap(n)})})(h1);
const W=[...document.querySelectorAll('h1 .w')], ems=[...document.querySelectorAll('h1 em')];
const $=s=>document.querySelector(s);
// colocar la línea de apoyo debajo de la frase
const p=$('p'); p.style.top=(h1.offsetTop+h1.offsetHeight+70)+'px';
const cl=x=>Math.max(0,Math.min(1,x)), ease=x=>1-Math.pow(1-cl(x),3);
const win=(t,a,d)=>ease((t-a)/d);
window.render=function(t,D){
  const out=cl((t-(D-0.6))/0.6); // fundido final suave
  $('.bar').style.width=(120*win(t,0.2,0.6))+'px';
  const tg=win(t,0.5,0.6); $('.tag').style.opacity=tg; $('.tag').style.transform='translateX('+(-30*(1-tg))+'px)';
  const q=win(t,0,1.2); $('.q').style.opacity=.35*q; $('.q').style.transform='translateY('+(-40*(1-q)+t*-4)+'px)';
  const step=Math.min(0.32,1.6/W.length);
  W.forEach((w,i)=>{const k=win(t,1.0+i*step,0.55); w.style.opacity=k; w.style.transform='translateY('+(50*(1-k))+'px)'});
  const hEnd=1.0+W.length*step+0.3;
  ems.forEach(e=>{if(e.style.backgroundImage!==undefined) e.style.backgroundSize=(100*win(t,hEnd,0.5))+'% 100%'});
  const s=win(t,hEnd+0.6,0.7); p.style.opacity=s; p.style.transform='translateY('+(30*(1-s))+'px)';
  const f=win(t,hEnd+1.2,0.7); $('.foot').style.opacity=f; $('.foot').style.transform='translateY('+(40*(1-f))+'px)';
  // leve "respiración" de la frase mientras queda en pantalla
  h1.style.transform='scale('+(1+0.012*cl((t-hEnd)/(D-hEnd)))+')'; h1.style.transformOrigin='left top';
  document.body.style.opacity=1-out*0.0; // sin fundido a negro (loop limpio)
};
</script></body></html>`;
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html); await pg.waitForTimeout(300);
  for (let i = 0; i < N; i++) {
    await pg.evaluate(([tt, d]) => window.render(tt, d), [i / FPS, DUR]);
    await pg.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await b.close();
  let music = c.music;
  if (!music) { music = path.join(tmp, 'm.wav');
    execFileSync('python3', ['-I', path.join(__dirname, 'musica.py'), music, String(DUR), c.mood || 'calido'], { stdio: 'inherit' }); }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%04d.jpg'), '-i', music,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-af', `afade=t=out:st=${DUR - 1.5}:d=1.5`, '-t', String(DUR), '-movflags', '+faststart', out], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('ok', out);
})();
