// Character image paths live under assets/characters.
PEOPLE.forEach(p=>{p.image=`assets/characters/${p.id}.png`});
// app.js may have rendered the first screen before this path override loaded.
document.querySelectorAll('img').forEach(img=>{
  const file=(img.getAttribute('src')||'').split('/').pop();
  if(PEOPLE.some(p=>`${p.id}.png`===file))img.src=`assets/characters/${file}`;
});
