// Personal profile and non-party interaction refinements.
async function loadSentSecretMessages(){
  await loadGame();
  const target=state.assignments&&state.assignments[state.user];
  if(!target)return {target:null,messages:[]};
  const r=await fetch(`${SUPABASE_URL}/rest/v1/secret_messages?sender_id=eq.${encodeURIComponent(state.user)}&receiver_id=eq.${encodeURIComponent(target)}&select=id,message,created_at&order=created_at.desc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('sent message load');
  return {target:person(target),messages:await r.json()};
}
function sentSecretMessagesHtml(target,messages){
  const title=target?`${esc(target.name)}에게 보낸 메시지`:'보낸 메시지';
  return `<section class="sent-secret-card"><div class="mission-head"><div><span class="mission-kicker">SENT MESSAGES</span><h2>${title}</h2></div><b>${messages.length}</b></div><p class="muted">마니또에게 익명으로 보낸 메시지를 모아봤어.</p><div class="message-list">${messages.length?messages.map(x=>`<article class="secret-message sent-secret-message"><div><small>${formatMessageDate(x.created_at)}</small></div><p>${esc(x.message).replace(/\n/g,'<br>')}</p></article>`).join(''):'<p class="muted">아직 보낸 메시지가 없어.</p>'}</div></section>`;
}
function ensureSentSecretModalStyles(){
  if(document.getElementById('sent-secret-modal-style'))return;
  const style=document.createElement('style');
  style.id='sent-secret-modal-style';
  style.textContent='.sent-secret-modal{position:fixed;inset:0;z-index:10020;display:flex;align-items:flex-end;justify-content:center;padding:18px;background:rgba(37,29,22,.42);box-sizing:border-box}.sent-secret-modal[hidden]{display:none}.sent-secret-modal-sheet{position:relative;width:min(100%,520px);max-height:min(76vh,680px);overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;padding:22px 18px calc(22px + env(safe-area-inset-bottom));border-radius:24px;background:#fffaf4;box-shadow:0 18px 50px rgba(35,26,18,.24)}.sent-secret-modal-close{position:absolute;top:13px;right:13px;z-index:2;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:rgba(74,61,48,.08);font-size:25px;line-height:32px;color:#51483f}.sent-secret-modal .mission-head{padding-right:38px}.sent-secret-modal .message-list{max-height:none}.personal-page{padding-bottom:calc(145px + env(safe-area-inset-bottom))!important}.personal-page #sent-secret-open{display:block!important;width:50%!important;min-width:0!important;margin:14px auto 8px!important;padding:12px 10px!important;font-size:13px!important;line-height:1.25!important}.personal-page .personal-logout{display:block!important;position:relative!important;z-index:2!important;margin:8px auto 34px!important}';
  document.head.appendChild(style);
}
async function openSentSecretMessagesModal(){
  ensureSentSecretModalStyles();
  let modal=document.getElementById('sent-secret-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='sent-secret-modal';
    modal.className='sent-secret-modal';
    modal.innerHTML='<section class="sent-secret-modal-sheet" role="dialog" aria-modal="true" aria-label="마니또에게 보낸 메시지"><button class="sent-secret-modal-close" type="button" aria-label="닫기">×</button><div class="sent-secret-modal-body"><p class="muted">불러오는 중...</p></div></section>';
    document.body.appendChild(modal);
  }
  const close=()=>{modal.hidden=true;document.body.style.overflow=''};
  modal.hidden=false;
  document.body.style.overflow='hidden';
  modal.querySelector('.sent-secret-modal-close').onclick=close;
  modal.onclick=e=>{if(e.target===modal)close()};
  const body=modal.querySelector('.sent-secret-modal-body');
  body.innerHTML='<p class="muted">불러오는 중...</p>';
  try{const data=await loadSentSecretMessages();if(!modal.hidden)body.innerHTML=sentSecretMessagesHtml(data.target,data.messages)}catch(e){console.warn('sent messages',e);if(!modal.hidden)body.innerHTML='<p class="muted">보낸 메시지를 불러오지 못했어.</p>'}
}

me=async function(){const p=person(state.user);let current='';try{const moods=await loadMoodStatuses();current=moods[state.user]?.emoji||''}catch(e){console.warn('mood load',e)}ensureSentSecretModalStyles();$('#app').innerHTML=shell(`<button id="me-home" class="text-back personal-home-back">‹ HOME으로</button><section class="card personal-profile-card"><div class="personal-identity"><div class="personal-avatar">${visual(p,'personal-avatar-img')}</div><button id="personal-mood-current" class="personal-mood-bubble" type="button" aria-label="상태 이모지 수정"><small>이거 내 이모지야</small><b>${esc(current||'＋')}</b></button></div><h2 class="character-${p.id}">${esc(p.name)}</h2></section><div id="mission-calendar-holder"></div><button id="sent-secret-open" class="secondary" type="button">마니또에게 보낸 메시지 보기</button><button id="logout" class="personal-logout" type="button">로그아웃</button>`);const main=$('#app .shell');if(main)main.classList.add('personal-page');bindNav();$('#me-home').onclick=home;$('#personal-mood-current').onclick=()=>openMoodEditor(current);$('#sent-secret-open').onclick=openSentSecretMessagesModal;$('#logout').onclick=()=>{state.user=null;selected=null;save();login()};if(typeof renderMissionCalendar==='function')renderMissionCalendar()};

// Mission 9 is a non-passable automatic action: open the assigned person's wishlist.
const wishlistActionBaseSecret=secret;
secret=async function(){await wishlistActionBaseSecret();const page=document.querySelector('.secret-page');if(page&&!document.querySelector('#sent-secret-from-secret')){const identity=page.querySelector('.secret-person-card');if(identity){const button=document.createElement('button');button.id='sent-secret-from-secret';button.className='secondary';button.type='button';button.textContent='보낸 메시지 보기';button.onclick=openSentSecretMessagesModal;identity.insertAdjacentElement('afterend',button)}}let rows=[];try{rows=await loadMissions(state.user)}catch(e){return}const current=typeof currentMissionRow==='function'?currentMissionRow(rows):rows.find(x=>x.status==='pending');if(!current||Number(current.mission_id)!==9)return;const card=document.querySelector('.secret-page .mission-card');if(!card)return;const actions=card.querySelector('.mission-actions')||card;const pass=card.querySelector('#mission-pass');if(pass)pass.remove();let button=card.querySelector('#mission-wishlist-open');if(!button){button=document.createElement('button');button.id='mission-wishlist-open';button.className='primary';button.type='button';button.textContent='마니또의 위시리스트 확인하기';actions.appendChild(button)}button.onclick=async()=>{try{await loadGame();await loadWishlists();const target=state.assignments&&state.assignments[state.user];if(!target)return alert('마니또 정보를 불러오지 못했어.');await wishDetail(target,false)}catch(e){alert('위시리스트를 열지 못했어.')}}};
