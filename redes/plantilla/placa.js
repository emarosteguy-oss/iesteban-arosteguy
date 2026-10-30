// Uso: node placa.js '<json>' salida.png
// json: {"theme":"light|dark|celeste","tag":"TEMA","head":"Frase con <em>énfasis</em>","sub":"Línea de apoyo"}
// Opcional "foto":"ruta/a/foto.jpg" -> la foto va de fondo con velo azul marino; el texto baja a la parte inferior.
// Opcional "focus":"center|top|bottom" (o "50% 30%") para encuadrar la foto.
// Opcional "pos":"top" -> con foto, el texto va arriba (útil si las caras están en la mitad de abajo).
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const c = JSON.parse(process.argv[2]); const out = process.argv[3];
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'logo41.jpg')).toString('base64');
const themes = {
  light:  { bg:'#F6F4EF', ink:'#14213D', accent:'#4A90C8', sub:'#3E4A61', rule:'#14213D', em:'#4A90C8' },
  dark:   { bg:'#14213D', ink:'#FFFFFF', accent:'#8CC4EC', sub:'#C9D3E3', rule:'#8CC4EC', em:'#8CC4EC' },
  celeste:{ bg:'#BFDDF2', ink:'#0F1B33', accent:'#FFFFFF', sub:'#22324F', rule:'#0F1B33', em:'#0F1B33', emBg:'#fff' },
};
const foto = c.foto ? 'data:image/jpeg;base64,' + fs.readFileSync(c.foto).toString('base64') : null;
const t = foto ? themes.dark : (themes[c.theme] || themes.light);
const fotoCss = foto ? `
.ph{position:absolute;inset:0;background:url(${foto}) ${c.focus||'center'}/cover no-repeat}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,33,61,.80) 0%,rgba(20,33,61,.15) 22%,rgba(20,33,61,0) 38%,rgba(20,33,61,.55) 55%,rgba(20,33,61,.93) 72%,#14213D 100%)}
.q{display:none}
.tag{color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.txt{position:absolute;left:96px;right:96px;bottom:310px;display:flex;flex-direction:column;gap:26px}
.txt h1,.txt p{position:static}
.txt p{color:#E3EAF4;margin-right:44px}
${c.pos==='top'?`.veil{background:linear-gradient(180deg,rgba(20,33,61,.92) 0%,rgba(20,33,61,.75) 30%,rgba(20,33,61,.15) 46%,rgba(20,33,61,0) 58%,rgba(20,33,61,.55) 76%,#14213D 92%)}
.txt{top:230px;bottom:auto}`:''}` : '';
const html = `<!DOCTYPE html><html><head><style>
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:${t.bg};font-family:'Inter',sans-serif;color:${t.ink};position:relative;overflow:hidden}
.bar{position:absolute;left:96px;top:110px;width:120px;height:14px;background:${t.accent}}
.tag{position:absolute;left:96px;top:150px;font-size:30px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:${t.sub}}
.q{position:absolute;right:70px;top:40px;font-family:'DejaVu Serif',serif;font-size:420px;line-height:1;color:${t.accent};opacity:.35}
h1{position:absolute;left:96px;right:96px;top:330px;font-family:'Inter Display','Inter',sans-serif;font-weight:800;font-size:${c.size||104}px;line-height:1.05;letter-spacing:-.02em}
h1 em{font-style:normal;color:${t.em};${t.emBg?`background:${t.emBg};padding:0 14px;`:''}}
p{position:absolute;left:96px;right:140px;bottom:320px;font-size:40px;line-height:1.35;color:${t.sub}}
.foot{position:absolute;left:96px;right:96px;bottom:90px;border-top:3px solid ${t.rule};padding-top:30px;display:flex;align-items:center;gap:28px}
.logo{width:120px;height:120px;border-radius:50%;object-fit:cover;flex:none}
.who{display:flex;flex-direction:column;gap:6px}
.name{font-family:'Inter Display','Inter',sans-serif;font-weight:700;font-size:44px;line-height:1.1}
.role{font-size:30px;color:${t.sub};font-weight:500}
.place{margin-left:auto;font-size:26px;color:${t.sub};letter-spacing:.06em;align-self:flex-end;padding-bottom:6px}
${fotoCss}
</style></head><body>
${foto?'<div class="ph"></div><div class="veil"></div>':''}
<div class="q">“</div><div class="bar"></div><div class="tag">${c.tag}</div>
${foto?`<div class="txt"><h1>${c.head}</h1><p>${c.sub}</p></div>`:`<h1>${c.head}</h1><p>${c.sub}</p>`}
<div class="foot"><img class="logo" src="${logo}"><div class="who"><span class="name">Esteban Arosteguy</span><span class="role">Edil (S) · Partido Nacional</span></div><span class="place">San José</span></div>
</body></html>`;
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport:{ width:1080, height:1350 } });
  await pg.setContent(html); await pg.waitForTimeout(200);
  await pg.screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png', ...(out.endsWith('.jpg') ? { quality: 90 } : {}) });
  await b.close(); })();
