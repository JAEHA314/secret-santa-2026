// Required first mission: wishlist. Stored in Supabase as mission_id 25.
const FIRST_WISH_MISSION_ID=25;
const TOTAL_MISSIONS=25;

saveWishlist=async function(id,likes,dislikes){
  const payload={player_id:id,likes,dislikes,updated_at:new Date().toISOString()};
  const r=await fetch(`${SUPABASE_URL}/rest/v1/wishlists`,{method:'POST',headers:{...apiHeaders,Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('wishlist save');
  const rows=await r.json();
  state.wishlists[id]=rows[0]||payload;
  save();
};

ensureMissions=async function(){
  let rows=await loadMissions();
  if(rows.length===TOTAL_MISSIONS)return rows;
  if(rows.length)throw new Error('mission setup incomplete');
  const randomOrder=shuffle(MISSIONS.map(m=>m.id));
  const payload=[
    {player_id:state.user,mission_id:FIRST_WISH_MISSION_ID,queue_order:1,status:'pending',note:'',pass_count:0},
    ...randomOrder.map((mission_id,i)=>({player_id:state.user,mission_id,queue_order:i+2,status:'pending',note:'',pass_count:0}))
  ];
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_missions`,{method:'POST',headers:apiHeaders,body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('mission setup');
  return loadMissions();
};

async function completeFirstWish(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_missions?player_id=eq.${encodeURIComponent(state.user)}&mission_id=eq.${FIRST_WISH_MISSION_ID}`,{
    method:'PATCH',
    headers:{...apiHeaders,Prefer:'return=representation'},
    body:JSON.stringify({status:'completed',note:'위시리스트 작성 완료',completed_at:new Date().toISOString()})
  });
  if(!r.ok)throw new Error(`first wish complete ${r.status}`);
  const rows=await r.json();
  if(!rows.length)throw new Error('first wish row missing');
}

const secretBeforeFirstWish=secret;
secret=async function(){
  try{await loadGame()}catch(e){}
  const has=!!state.drawnBy[state.user];
  if(!has){
    $('#app').innerHTML=shell(`<section class="card secret-person-card"><h2>내 마니또를 뽑아볼까?</h2><div class="reveal">🎁</div><button id="draw" class="primary">마니또 뽑기</button></section>`);
    const main=$('#app .shell');if(main)main.classList.add('secret-page');
    bindNav();
    $('#draw').onclick=async()=>{try{await createAssignmentsIfNeeded();await setDrawn(state.user,true);secret()}catch(e){alert('마니또 추첨에 실패했어.')}};
    return;
  }

  let rows=[];
  try{rows=await ensureMissions()}catch(e){console.warn(e);return alert('미션을 불러오지 못했어.');}
  const first=rows.find(x=>Number(x.mission_id)===FIRST_WISH_MISSION_ID);
  if(first&&first.status!=='completed'){
    const t=state.assignments&&person(state.assignments[state.user]);
    const identity=t?`<section class="card secret-person-card"><h2>내가 챙길 사람은…</h2><div class="reveal">${visual(t,'reveal-img')}</div><h2 style="text-align:center">${t.name}</h2></section>`:'';
    const mission=`<section class="card mission-card"><div class="mission-head"><span class="mission-kicker">FIRST MISSION · WISH</span><b>0/25</b></div><h2>나의 위시리스트 작성하기</h2><p class="muted">마니또가 선물을 고를 수 있도록 좋아하는 것과 싫어하는 것을 적어줘.</p><button id="first-wish-open" class="primary">위시리스트 작성하기</button></section>`;
    $('#app').innerHTML=shell(`${identity}${mission}`);
    const main=$('#app .shell');if(main)main.classList.add('secret-page');
    bindNav();
    $('#first-wish-open').onclick=()=>openFirstWishlist(first);
    return;
  }
  return secretBeforeFirstWish();
};

function openFirstWishlist(firstRow){
  const p=person(state.user),w=state.wishlists[state.user]||{likes:'',dislikes:''};
  $('#app').innerHTML=shell(`<button id="first-wish-back" class="text-back">‹ SECRET으로</button><section class="card wish-detail first-wish-card"><div class="wish-profile"><span class="wish-face">${visual(p,'wish-detail-img')}</span><h2 class="character-${p.id}">${p.name}</h2></div><label>❤️ 좋아요</label><textarea id="first-wish-likes" class="field wish-textarea">${esc(w.likes||'')}</textarea><label>💔 싫어요</label><textarea id="first-wish-dislikes" class="field wish-textarea">${esc(w.dislikes||'')}</textarea><button id="first-wish-save" class="primary">저장하고 미션 완료</button></section>`);
  const main=$('#app .shell');if(main)main.classList.add('first-wish-page');
  bindNav();
  $('#first-wish-back').onclick=secret;
  $('#first-wish-save').onclick=async()=>{
    const likes=$('#first-wish-likes').value.trim(),dislikes=$('#first-wish-dislikes').value.trim();
    if(!likes&&!dislikes)return alert('좋아하는 것 또는 싫어하는 것을 하나 이상 적어줘.');
    const b=$('#first-wish-save');b.disabled=true;
    try{
      await saveWishlist(state.user,likes,dislikes);
      await completeFirstWish();
      await loadWishlists();
      secret();
    }catch(e){
      console.error(e);
      b.disabled=false;
      alert('저장하지 못했어. 다시 시도해줘.');
    }
  };
}

const homeBeforeFirstWish=home;
home=async function(){
  await homeBeforeFirstWish();
  document.querySelectorAll('.race-row>b').forEach(el=>{el.textContent=el.textContent.replace('/24','/25')});
  const titleCount=document.querySelector('.race-title>b');if(titleCount)titleCount.textContent=titleCount.textContent.replace('/24','/25');
  document.querySelectorAll('.race-track i').forEach(bar=>{const row=bar.closest('.race-row');const count=Number((row&&row.querySelector('b')?.textContent||'0').split('/')[0])||0;bar.style.width=`${count/TOTAL_MISSIONS*100}%`});
};
