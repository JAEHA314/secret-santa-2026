// Required first mission: complete my wishlist before randomized missions begin.
// This is stored locally because existing player_missions rows already contain the 24 randomized missions.
const FIRST_WISH_KEY='ss26-first-wish-complete';
function firstWishMap(){try{return JSON.parse(localStorage.getItem(FIRST_WISH_KEY)||'{}')}catch(e){return {}}}
function firstWishDone(){return !!firstWishMap()[state.user]}
function setFirstWishDone(){const m=firstWishMap();m[state.user]=true;localStorage.setItem(FIRST_WISH_KEY,JSON.stringify(m))}

const secretBeforeFirstWish=secret;
secret=async function(){
  try{await loadGame()}catch(e){}
  const has=!!state.drawnBy[state.user];

  // Before drawing, show only the draw card. Missions begin after the recipient is revealed.
  if(!has){
    $('#app').innerHTML=shell(`<section class="card secret-person-card"><h2>내 마니또를 뽑아볼까?</h2><div class="reveal">🎁</div><button id="draw" class="primary">마니또 뽑기</button></section>`);
    const main=$('#app .shell');if(main)main.classList.add('secret-page');
    bindNav();
    $('#draw').onclick=async()=>{try{await createAssignmentsIfNeeded();await setDrawn(state.user,true);secret()}catch(e){alert('마니또 추첨에 실패했어.')}};
    return;
  }

  // Everyone receives this as the first, non-passable mission.
  if(!firstWishDone()){
    const t=state.assignments&&person(state.assignments[state.user]);
    const identity=t?`<section class="card secret-person-card"><h2>내가 챙길 사람은…</h2><div class="reveal">${visual(t,'reveal-img')}</div><h2 style="text-align:center">${t.name}</h2></section>`:'';
    const mission=`<section class="card mission-card"><div class="mission-head"><span class="mission-kicker">FIRST MISSION · WISH</span><b>0/25</b></div><h2>나의 위시리스트 작성하기</h2><p class="muted">마니또가 선물을 고를 수 있도록 좋아하는 것과 싫어하는 것을 적어줘. 이 미션은 PASS할 수 없어.</p><button id="first-wish-open" class="primary">위시리스트 작성하기</button></section>`;
    $('#app').innerHTML=shell(`${identity}${mission}`);
    const main=$('#app .shell');if(main)main.classList.add('secret-page');
    bindNav();
    $('#first-wish-open').onclick=()=>wishDetail(state.user,true);
    return;
  }

  return secretBeforeFirstWish();
};

// Completing/saving one's wishlist completes the required first mission.
const wishDetailBeforeFirstWish=wishDetail;
wishDetail=function(id,editing=false){
  wishDetailBeforeFirstWish(id,editing);
  if(id!==state.user||!editing||!$('#save-wish'))return;
  const original=$('#save-wish').onclick;
  $('#save-wish').onclick=async()=>{
    try{
      await saveWishlist(id,$('#wish-likes').value.trim(),$('#wish-dislikes').value.trim());
      setFirstWishDone();
      secret();
    }catch(e){alert('저장 실패')}
  };
};

// Existing race is still the 24 randomized missions; display it as 25 including the required wishlist mission.
const missionCountsBeforeFirstWish=missionCounts;
missionCounts=async function(){
  const counts=await missionCountsBeforeFirstWish();
  const local=firstWishMap();
  return counts.map(x=>({...x,count:x.count+(local[x.person.id]?1:0)}));
};
