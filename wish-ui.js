// Final wishlist routes.
async function wish(){
  $('#app').innerHTML=shell(`<section class="route-placeholder" aria-hidden="true"></section>`);
  try{await Promise.all([loadSharedSettings(),loadWishlists()])}catch(e){console.warn(e)}
  $('#app').innerHTML=shell(`<section class="card wish-list-card"><div class="wish-title-row"><h2>우리의 위시리스트</h2><button id="wish-gift-limit" class="wish-gift-limit" type="button">선물 상한 <b>${Number(state.giftLimit).toLocaleString()}원</b></button></div><p class="muted wish-intro">친구를 눌러 좋아하는 것과 싫어하는 것을 확인해봐.</p><div class="wish-people">${PEOPLE.map(p=>`<button class="wish-person character-${p.id}" data-wish-person="${p.id}"><span>${visual(p,'wish-thumb')}</span><b>${p.name}</b>${p.id===state.user?'<small>나</small>':''}</button>`).join('')}</div></section>`);
  const main=$('#app .shell');if(main)main.classList.add('wish-page');bindNav();
  $('#wish-gift-limit').onclick=()=>editSharedSetting('gift');
  document.querySelectorAll('[data-wish-person]').forEach(b=>b.onclick=()=>wishDetail(b.dataset.wishPerson));
}
async function wishDetail(id,editing=false){
  const p=person(id);try{await Promise.all([loadWishlists(),loadGame()])}catch(e){}const w=state.wishlists[id]||{likes:'',dislikes:''},mine=id===state.user;
  let wishlistMission=null;if(!editing&&!mine){try{const rows=await loadMissions();const current=currentMissionRow(rows),target=state.assignments&&state.assignments[state.user];if(current&&Number(current.mission_id)===9&&id===target)wishlistMission=current}catch(e){console.warn(e)}}
  const missionDone=wishlistMission?'<button id="complete-wishlist-mission" class="primary wish-mission-complete">미션 완료</button>':'';
  const view=`<div class="wish-section"><h3>❤️ 좋아요</h3><p>${w.likes?esc(w.likes).replace(/\n/g,'<br>'):'아직 적어둔 내용이 없어.'}</p></div><div class="wish-section"><h3>💔 싫어요</h3><p>${w.dislikes?esc(w.dislikes).replace(/\n/g,'<br>'):'아직 적어둔 내용이 없어.'}</p></div>${mine?'<button id="edit-wish" class="primary">수정하기</button>':missionDone}`;
  const edit=`<label>❤️ 좋아요</label><textarea id="wish-likes" class="field wish-textarea">${esc(w.likes)}</textarea><label>💔 싫어요</label><textarea id="wish-dislikes" class="field wish-textarea">${esc(w.dislikes)}</textarea><div class="wish-edit-actions"><button id="save-wish" class="primary">저장하기</button><button id="cancel-wish" class="secondary">취소</button></div>`;
  $('#app').innerHTML=shell(`<button id="wish-back" class="text-back">‹ 모두 보기</button><section class="card wish-detail ${editing?'wish-editing':''}"><div class="wish-profile"><span class="wish-face">${visual(p,'wish-detail-img')}</span><h2 class="character-${p.id}">${p.name}</h2></div>${editing?edit:view}</section>`);
  const main=$('#app .shell');if(main)main.classList.add('wish-detail-page');const nav=document.querySelector('.nav');if(nav)nav.remove();bindNav();
  $('#wish-back').onclick=wish;if($('#edit-wish'))$('#edit-wish').onclick=()=>wishDetail(id,true);if($('#cancel-wish'))$('#cancel-wish').onclick=()=>wishDetail(id,false);if($('#save-wish'))$('#save-wish').onclick=async()=>{try{await saveWishlist(id,$('#wish-likes').value.trim(),$('#wish-dislikes').value.trim());wishDetail(id,false)}catch(e){alert('저장 실패')}};
  if($('#complete-wishlist-mission'))$('#complete-wishlist-mission').onclick=async()=>{const b=$('#complete-wishlist-mission');b.disabled=true;try{await completeMission(wishlistMission,'마니또 위시리스트 확인 완료');secret()}catch(e){b.disabled=false;alert('미션 완료 처리에 실패했어.')}};
}
