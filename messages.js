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

me=async function(){
  const u=person(state.user);
  let messages=[];
  try{messages=await loadSecretMessages()}catch(e){console.warn(e)}
  $('#app').innerHTML=shell(`<section class="card"><div class="reveal">${visual(u,'reveal-img')}</div><h2 style="text-align:center">${u.name}</h2><button id="logout" class="secondary">로그아웃</button></section>${secretInboxHtml(messages)}<section class="card"><h3>게임 설정</h3><label>연말 파티 날짜</label><input id="date" class="field" type="date" value="${state.dDay}"><label>선물 최대 금액</label><input id="price" class="field" type="number" value="${state.giftLimit}"><button id="settings" class="primary">설정 저장</button></section>`);
  bindNav();
  $('#logout').onclick=()=>{state.user=null;save();render()};
  $('#settings').onclick=async()=>{try{await saveSharedSettings($('#date').value,Math.max(0,Number($('#price').value)||0));alert('모두에게 저장했어!')}catch(e){alert('저장 실패')}};
};
