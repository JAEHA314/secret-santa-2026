// Shared Christmas tree progression. Every 10 completed missions unlocks one layer.
const TREE_TOTAL_MISSIONS=150;
const TREE_STAGE_SIZE=10;
const TREE_LAYERS=[
  'tree-light.png',
  'tree-ribbon.png',
  'tree-socks.png',
  'tree-ball1.png',
  'tree-gift1.png',
  'tree-cookie.png',
  'tree-snow.png',
  'tree-candy.png',
  'tree-ball3.png',
  'tree-ball2.png',
  'tree-house.png',
  'tree-letter.png',
  'tree-bell.png',
  'tree-gift2.png',
  'tree-star.png'
];

function sharedTreeHtml(completed){
  const safe=Math.max(0,Math.min(TREE_TOTAL_MISSIONS,Number(completed)||0));
  const stage=Math.min(TREE_LAYERS.length,Math.floor(safe/TREE_STAGE_SIZE));
  const layers=TREE_LAYERS.slice(0,stage).map((file,index)=>`<img class="shared-tree-layer" src="assets/tree/${file}" alt="" aria-hidden="true" data-tree-stage="${index+1}">`).join('');
  return `<div class="shared-tree-wrap" aria-label="공동 미션 ${safe}/${TREE_TOTAL_MISSIONS}, 트리 ${stage}/15단계"><div class="shared-tree-canvas"><img class="shared-tree-bg" src="assets/tree/tree-bg.png" alt=""><img class="shared-tree-layer shared-tree-base" src="assets/tree/tree.png" alt="장식이 자라나는 무무클럽 공동 크리스마스트리">${layers}</div><div class="shared-tree-progress"><b>${safe}/${TREE_TOTAL_MISSIONS}</b><span>${stage===15?'트리 완성!':`다음 장식까지 ${TREE_STAGE_SIZE-(safe%TREE_STAGE_SIZE)}개의 미션`}</span></div></div>`;
}

async function loadSharedTreeCompleted(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_missions?status=eq.completed&select=player_id,mission_id`,{headers:apiHeaders});
  if(!r.ok)throw new Error('tree progress load');
  const rows=await r.json();
  return Math.min(TREE_TOTAL_MISSIONS,rows.length);
}

const treeProgressBaseHome=home;
home=async function(){
  await treeProgressBaseHome();
  const hero=document.querySelector('.hero');
  if(!hero)return;
  let completed=0;
  try{completed=await loadSharedTreeCompleted()}catch(e){console.warn('tree progress',e)}
  const oldTree=hero.querySelector('.tree');
  if(oldTree)oldTree.outerHTML=sharedTreeHtml(completed);
};
