// Character image paths live under assets/characters.
// Keep a deploy query on image URLs so replacing an asset with the same filename is visible immediately.
const CHARACTER_ASSET_VERSION='20261030-12';
PEOPLE.forEach(p=>{p.image=`assets/characters/${p.id}.png?v=${CHARACTER_ASSET_VERSION}`});
// app.js may have rendered the first screen before this path override loaded.
document.querySelectorAll('img').forEach(img=>{
  const raw=(img.getAttribute('src')||'').split('?')[0];
  const file=raw.split('/').pop();
  if(PEOPLE.some(p=>`${p.id}.png`===file))img.src=`assets/characters/${file}?v=${CHARACTER_ASSET_VERSION}`;
});
