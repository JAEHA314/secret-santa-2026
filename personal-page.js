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
  return `<section class="card sent-secret-card"><div class="mission-head"><div><span class="mission-kicker">SENT MESSAGES</span><h2>${title}</h2></div><b>${messages.length}</b></div><p class="muted">마니또에게 익명으로 보낸 메시지를 모아봤어.</p><div class="message-list">${messages.length?messages.map(x=>`<article class="secret-message sent-secret-message"><div><small>${formatMessageDate(x.created_at)}</small></div><p>${esc(x.message).replace(/\n/g,'<br>')}</p></article>`).join(''):'<p class="muted">아직 보낸 메시지가 없어.</p>'}</div></section>`;
}
async function sentSecretMessagesPage(back='me'){
  $('#app').innerHTML=shell(`<section class="route-placeholder" aria-hidden="true"></section>`);
  let data={target:null,messages:[]};
  try{data=await loadSentSecretMessages()}catch(e){console.warn('sent messages',e)}
  $('#app').innerHTML=shell(`<button id="sent-message-back" class="text-back">‹ ${back==='secret'?'SECRET으로':'ME로'}</button>${sentSecretMessagesHtml(data.target,data.messages)}`);
  const main=$('#app .shell');if(main)main.classList.add('personal-page','sent-secret-page');
  bindNav();
  $('#sent-message-back').onclick=()=>back==='secret'?secret():me();
}

me=async function(){const p=person(state.user);let current='';try{const moods=await loadMoodStatuses();current=moods[state.user]?.emoji||''}catch(e){console.warn('mood load',e)}$('#app').innerHTML=shell(`<button id="me-home" class="text-back personal-home-back">‹ HOME으로</button><section class="card personal-profile-card"><div class="personal-identity"><div class="personal-avatar">${visual(p,'personal-avatar-img')}</div><button id="personal-mood-current" class="personal-mood-bubble" type="button" aria-label="상태 이모지 수정"><small>이거 내 이모지야</small><b>${esc(current||'＋')}</b></button></div><h2 class="character-${p.id}">${esc(p.name)}</h2></section><button id="sent-secret-open" class="secondary" type="button">마니또에게 보낸 메시지 보기</button><div id="mission-calendar-holder"></div><button id="logout" class="personal-logout" type="button">로그아웃</button>`);const main=$('#app .shell');if(main)main.classList.add('personal-page');bindNav();$('#me-home').onclick=home;$('#personal-mood-current').onclick=()=>openMoodEditor(current);$('#sent-secret-open').onclick=()=>sentSecretMessagesPage('me');$('#logout').onclick=()=>{state.user=null;selected=null;save();login()};if(typeof renderMissionCalendar==='function')renderMissionCalendar()};

// Mission 9 is a non-passable automatic action: open the assigned person's wishlist.
const wishlistActionBaseSecret=secret;
secret=async function(){await wishlistActionBaseSecret();const page=document.querySelector('.secret-page');if(page&&!document.querySelector('#sent-secret-from-secret')){const identity=page.querySelector('.secret-person-card');if(identity){const button=document.createElement('button');button.id='sent-secret-from-secret';button.className='secondary';button.type='button';button.textContent='보낸 메시지 보기';button.onclick=()=>sentSecretMessagesPage('secret');identity.insertAdjacentElement('afterend',button)}}let rows=[];try{rows=await loadMissions(state.user)}catch(e){return}const current=typeof currentMissionRow==='function'?currentMissionRow(rows):rows.find(x=>x.status==='pending');if(!current||Number(current.mission_id)!==9)return;const card=document.querySelector('.secret-page .mission-card');if(!card)return;const actions=card.querySelector('.mission-actions')||card;const pass=card.querySelector('#mission-pass');if(pass)pass.remove();let button=card.querySelector('#mission-wishlist-open');if(!button){button=document.createElement('button');button.id='mission-wishlist-open';button.className='primary';button.type='button';button.textContent='마니또의 위시리스트 확인하기';actions.appendChild(button)}button.onclick=async()=>{try{await loadGame();await loadWishlists();const target=state.assignments&&state.assignments[state.user];if(!target)return alert('마니또 정보를 불러오지 못했어.');await wishDetail(target,false)}catch(e){alert('위시리스트를 열지 못했어.')}}};
