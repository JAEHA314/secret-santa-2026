async function loadSecretMessages(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/secret_messages?receiver_id=eq.${encodeURIComponent(state.user)}&select=id,message,created_at,read_at&order=created_at.desc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('message load');
  return r.json();
}

async function sendSecretMessage(message,missionId=null){
  await loadGame();
  const receiver=state.assignments&&state.assignments[state.user];
  if(!receiver)throw new Error('no assignment');
  const payload={sender_id:state.user,receiver_id:receiver,message};
  if(missionId)payload.mission_id=missionId;
  const r=await fetch(`${SUPABASE_URL}/rest/v1/secret_messages`,{method:'POST',headers:apiHeaders,body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('message send');
}

function formatMessageDate(value){
  const d=new Date(value);
  return `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`;
}

function secretInboxHtml(messages){
  return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">MY SECRET SANTA</span><h2>익명 메시지함</h2></div><b>${messages.length}</b></div><div class="message-list">${messages.length?messages.map(x=>`<article class="secret-message"><div><b>MY SECRET SANTA</b><small>${formatMessageDate(x.created_at)}</small></div><p>${esc(x.message).replace(/\n/g,'<br>')}</p></article>`).join(''):'<p class="muted">아직 도착한 메시지가 없어.</p>'}</div></section>`;
}

const originalMissionPrompt=missionPrompt;
missionPrompt=function(m){
  if(m.type==='message')return '내용을 적어 보내면 마니또에게 익명으로 전달되고 미션이 자동 완료돼.';
  return originalMissionPrompt(m);
};

secret=async function(){
  try{await loadGame()}catch(e){}
  const has=!!state.drawnBy[state.user];
  let rows=[];
  try{rows=await ensureMissions()}catch(e){console.warn(e)}
  const completed=rows.filter(x=>x.status==='completed').length;
  const current=rows.find(x=>x.status==='pending');
  const m=current&&MISSIONS.find(x=>x.id===current.mission_id);
  let identity;
  if(!has){
    identity=`<section class="card"><h2>내 마니또를 뽑아볼까?</h2><div class="reveal">🎁</div><button id="draw" class="primary">마니또 뽑기</button></section>`;
  }else{
    const t=state.assignments&&person(state.assignments[state.user]);
    identity=t?`<section class="card"><h2>내가 챙길 사람은…</h2><div class="reveal">${visual(t,'reveal-img')}</div><h2 style="text-align:center">${t.name}</h2></section>`:`<section class="card"><h2>추첨 정보를 불러오는 중이야.</h2></section>`;
  }

  let mission;
  if(m){
    const input=m.type==='message'
      ? `<textarea id="mission-message" class="field mission-note" placeholder="마니또에게 보낼 익명 메시지"></textarea>`
      : `<textarea id="mission-note" class="field mission-note" placeholder="기록을 남겨줘 (선택)"></textarea>`;
    const action=m.type==='message'
      ? `<button id="mission-send" class="primary">익명으로 보내기</button>`
      : `<button id="mission-complete" class="primary">완료</button>`;
    mission=`<section class="card mission-card"><div class="mission-head"><span class="mission-kicker">TODAY'S MISSION · ${missionTypeLabel(m.type)}</span><b>${completed}/24</b></div><h2>${esc(m.title)}</h2><p class="muted">${missionPrompt(m)}</p>${m.type==='link'?'<button id="mission-wish" class="secondary">WISH 보러가기</button>':''}${input}<div class="mission-actions"><button id="mission-pass" class="secondary">PASS</button>${action}</div></section>`;
  }else{
    mission=`<section class="card mission-card mission-clear"><span>⭐</span><h2>24/24 ALL CLEAR!</h2><p class="muted">모든 미션을 완료했어.</p></section>`;
  }

  $('#app').innerHTML=shell(`${identity}${mission}`);
  bindNav();
  if($('#draw'))$('#draw').onclick=async()=>{try{await createAssignmentsIfNeeded();await setDrawn(state.user,true);secret()}catch(e){alert('마니또 추첨에 실패했어.')}};
  if($('#mission-wish'))$('#mission-wish').onclick=wish;
  if($('#mission-complete'))$('#mission-complete').onclick=async()=>{try{await completeMission(current,$('#mission-note').value.trim());secret()}catch(e){alert('미션 완료 저장에 실패했어.')}};
  if($('#mission-pass'))$('#mission-pass').onclick=async()=>{try{await passMission(current,rows);secret()}catch(e){alert('PASS 저장에 실패했어.')}};
  if($('#mission-send'))$('#mission-send').onclick=async()=>{
    const text=$('#mission-message').value.trim();
    if(!text)return alert('보낼 메시지를 적어줘.');
    if(!has)return alert('먼저 마니또를 뽑아줘.');
    const button=$('#mission-send');
    button.disabled=true;
    try{
      await sendSecretMessage(text,m.id);
      await completeMission(current,text);
      alert('MY SECRET SANTA 이름으로 익명 메시지를 보냈어!');
      secret();
    }catch(e){
      button.disabled=false;
      alert('메시지를 보내지 못했어. 다시 시도해줘.');
    }
  };
};

home=async function(){
  try{await loadSharedSettings()}catch(e){}
  const u=person(state.user),d=days();
  let race=[];
  try{race=await missionCounts()}catch(e){console.warn(e)}
  race.sort((a,b)=>b.count-a.count);
  const leader=race.length?race[0].count:0;
  const mine=race.find(x=>x.person.id===state.user);
  const completed=mine?mine.count:0;
  const raceHtml=race.map(x=>`<div class="race-row"><div class="race-person">${visual(x.person,'race-img')}<span>${x.person.name}${leader>0&&x.count===leader?' 👑':''}</span></div><div class="race-track"><i style="width:${x.count/24*100}%"></i></div><b>${x.count}/24</b></div>`).join('');
  $('#app').innerHTML=shell(`<div class="top"><div><small>안녕,</small><h2>${u.name}!</h2></div><div class="avatar">${visual(u,'avatar-img')}</div></div><section class="card hero"><div class="tree">🎄</div><h2>${d>=0?'D-'+d:'PARTY DAY!'}</h2><p class="muted">모두의 미션으로 트리를 완성해요.</p></section><section class="card"><div class="race-title"><div><small>MISSION RACE</small><h3>우리의 미션 현황</h3></div><b>${completed}/24</b></div><div class="race-list">${raceHtml||'<p class="muted">아직 미션 기록이 없어.</p>'}</div></section><div class="stats"><button id="edit-party-date" class="stat" style="border:0;font:inherit;cursor:pointer">연말 파티<strong>${esc(state.dDay)}</strong></button><button id="edit-gift-limit" class="stat" style="border:0;font:inherit;cursor:pointer">선물 상한<strong>${Number(state.giftLimit).toLocaleString()}원</strong></button></div>`);
  bindNav();
  $('#edit-party-date').onclick=()=>editSharedSetting('date');
  $('#edit-gift-limit').onclick=()=>editSharedSetting('gift');
};

function editSharedSetting(type){
  const isDate=type==='date';
  const ok=confirm(`⚠️ ${isDate?'연말 파티 날짜':'선물 상한 금액'}를 수정할까요?\n\n여기서 변경하면 나뿐 아니라 무무클럽 모두에게 똑같이 적용돼요.`);
  if(!ok)return;
  const title=isDate?'연말 파티 날짜 수정':'선물 상한 수정';
  const input=isDate
    ? `<input id="shared-setting-value" class="field" type="date" value="${esc(state.dDay)}">`
    : `<input id="shared-setting-value" class="field" type="number" min="0" step="1000" value="${Number(state.giftLimit)||0}">`;
  $('#app').innerHTML=shell(`<section class="card"><h2>${title}</h2><p class="muted">⚠️ 저장하면 이 설정은 모든 멤버에게 변경돼요.</p>${input}<button id="save-shared-setting" class="primary">모두에게 적용</button><button id="cancel-shared-setting" class="secondary">취소</button></section>`);
  bindNav();
  $('#cancel-shared-setting').onclick=home;
  $('#save-shared-setting').onclick=async()=>{
    const value=$('#shared-setting-value').value;
    if(isDate&&!value)return alert('날짜를 선택해줘.');
    const nextDate=isDate?value:state.dDay;
    const nextGift=isDate?state.giftLimit:Math.max(0,Number(value)||0);
    if(!confirm('이 변경은 모든 멤버에게 바로 적용돼요. 저장할까요?'))return;
    try{await saveSharedSettings(nextDate,nextGift);alert('모두에게 적용했어!');home()}catch(e){alert('저장하지 못했어. 다시 시도해줘.')}
  };
}

me=async function(){
  const u=person(state.user);
  $('#app').innerHTML=shell(`<section class="card"><div class="reveal">${visual(u,'reveal-img')}</div><h2 style="text-align:center">${u.name}</h2><button id="logout" class="secondary">로그아웃</button></section>`);
  bindNav();
  $('#logout').onclick=()=>{state.user=null;save();render()};
};
