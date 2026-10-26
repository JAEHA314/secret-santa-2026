// Shared Christmas tree home. Every 10 completed missions unlocks one layer.
const TREE_TOTAL_MISSIONS=150;
const TREE_STAGE_SIZE=10;
const TREE_LAYERS=['tree-light.png','tree-ribbon.png','tree-socks.png','tree-ball1.png','tree-gift1.png','tree-cookie.png','tree-snow.png','tree-candy.png','tree-ball3.png','tree-ball2.png','tree-house.png','tree-letter.png','tree-bell.png','tree-gift2.png','tree-star.png'];

function treeFaceSrc(id){return `assets/characters/${id}-face.png`}
function treePartyDate(){
  const raw=state.dDay||'2026-12-27';
  const [y,m,d]=raw.split('-');
  return `${String(y).slice(2)}. ${Number(m)}. ${Number(d)}`;
}
function treeStatusHtml(completed){
  const safe=Math.max(0,Math.min(TREE_TOTAL_MISSIONS,Number(completed)||0));
  const remaining=safe>=TREE_TOTAL_MISSIONS?0:TREE_STAGE_SIZE-(safe%TREE_STAGE_SIZE);
  return `<div class="tree-status"><div>${safe>=TREE_TOTAL_MISSIONS?'트리 완성!':`다음 장식까지<br><b>${remaining}개의 미션</b>`}</div><strong>D-${Math.max(0,days())}</strong><span>${treePartyDate()}</span></div>`;
}
function treeRaceHtml(counts){
  const max=Math.max(0,...counts.map(x=>x.count));
  return `<div class="tree-race" aria-label="우리의 미션 현황">${counts.map(({person:p,count})=>`<div class="tree-racer"><span class="tree-crown">${max>0&&count===max?'👑':''}</span><img src="${treeFaceSrc(p.id)}" alt="${esc(p.name)}"><b>${count}/25</b></div>`).join('')}</div>`;
}
function sharedTreeHtml(completed,counts){
  const safe=Math.max(0,Math.min(TREE_TOTAL_MISSIONS,Number(completed)||0));
  const stage=Math.min(TREE_LAYERS.length,Math.floor(safe/TREE_STAGE_SIZE));
  const layers=TREE_LAYERS.slice(0,stage).map((file,index)=>`<img class="shared-tree-layer" src="assets/tree/${file}" alt="" aria-hidden="true" data-tree-stage="${index+1}">`).join('');
  return `<div class="shared-tree-wrap" aria-label="공동 미션 ${safe}/${TREE_TOTAL_MISSIONS}, 트리 ${stage}/15단계"><div class="shared-tree-canvas"><img class="shared-tree-bg" src="assets/tree/tree-bg.png" alt=""><img class="shared-tree-layer shared-tree-base" src="assets/tree/tree.png" alt="장식이 자라나는 무무클럽 공동 크리스마스트리">${layers}<button class="tree-board-link" type="button" aria-label="무무클럽 자유게시판 열기"><img src="assets/tree/board.png" alt="무무클럽 자유게시판"></button>${treeStatusHtml(safe)}${treeRaceHtml(counts)}</div></div>`;
}
async function loadSharedTreeCompleted(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_missions?status=eq.completed&select=player_id,mission_id`,{headers:apiHeaders});
  if(!r.ok)throw new Error('tree progress load');
  const rows=await r.json();
  return Math.min(TREE_TOTAL_MISSIONS,rows.length);
}

const treeProgressBaseHome=home;
home=async function(){
  // Clear the previous route before any legacy async wrappers start drawing.
  if(state.user){const app=$('#app');if(app)app.innerHTML=shell(`<section class="route-placeholder" aria-busy="true"></section>`)}
  await treeProgressBaseHome();
  const hero=document.querySelector('.hero');
  const main=document.querySelector('#app main');
  if(!hero||!main)return;
  main.classList.add('tree-home','page-loading');
  let completed=0,counts=[];
  try{[completed,counts]=await Promise.all([loadSharedTreeCompleted(),missionCounts()])}catch(e){console.warn('tree home',e);counts=PEOPLE.map(p=>({person:p,count:0}))}
  hero.innerHTML=sharedTreeHtml(completed,counts);
  Array.from(main.children).forEach(el=>{
    if(el.classList.contains('shared-header')||el===hero)return;
    el.classList.add('tree-home-hidden');
  });
  const boardLink=document.querySelector('.tree-board-link');
  if(boardLink&&typeof boardPage==='function')boardLink.onclick=boardPage;
  main.classList.remove('page-loading');
};

// Clear the old route synchronously on every bottom-nav transition. Keeping shell()
// here preserves the common header/nav, so no legacy page can flash while data loads.
const treeProgressBaseRender=render;
render=function(page='home'){
  if(state.user){
    const app=$('#app');
    if(app)app.innerHTML=shell(`<section class="route-placeholder" aria-busy="true"></section>`);
  }
  return treeProgressBaseRender(page);
};
