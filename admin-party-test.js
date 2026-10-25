// Admin tools for inspecting the sealed mailbox and rehearsing party-day reveal flows.
let adminPartyRehearsal=false;

async function adminLoadMailboxLetters(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=*&order=created_at.asc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('admin mailbox load');
  return r.json();
}

async function adminLoadSecretMessages(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/secret_messages?select=*&order=created_at.asc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('admin secret messages load');
  return r.json();
}

function adminPartyDate(value){
  if(!value)return '';
  const d=new Date(value);
  return `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`;
}

function adminMailbox(){
  adminLoadMailboxLetters().then(rows=>{
    const letters=rows.length?rows.map(x=>{
      const sender=person(x.sender_id),receiver=person(x.receiver_id);
      return `<article class="secret-message"><div><b>${sender?esc(sender.name):esc(x.sender_id)} → ${receiver?esc(receiver.name):esc(x.receiver_id)}</b><small>${adminPartyDate(x.created_at)}</small></div><p>${esc(x.message||'').replace(/\n/g,'<br>')}</p><small>${x.mission_id?`MISSION ${esc(x.mission_id)}`:'FREE LETTER'}</small></article>`;
    }).join(''):'<p class="muted">아직 우체통에 편지가 없어.</p>';
    $('#app').innerHTML=shell(`<section class="card admin"><button id="admin-mailbox-back" class="text-back">‹ ADMIN으로</button><div class="mission-head"><div><span class="mission-kicker">SEALED MAILBOX · ADMIN ONLY</span><h2>우체통 확인</h2></div><b>${rows.length}통</b></div><p class="muted">관리자 점검용 화면이야. 실제 멤버 화면에서는 파티 전까지 계속 봉인돼 있어.</p><div class="message-list">${letters}</div></section>`,false);
    $('#admin-mailbox-back').onclick=admin;
  }).catch(()=>alert('우체통을 불러오지 못했어.'));
}

async function adminPartyRehearsalPage(){
  let letters=[],messages=[];
  try{[letters,messages]=await Promise.all([adminLoadMailboxLetters(),adminLoadSecretMessages(),loadGame()])}catch(e){console.warn(e)}
  const assignments=state.assignments||{};
  const mapping=PEOPLE.map(p=>{
    const receiver=person(assignments[p.id]);
    return `<div class="admin-row"><div class="admin-main">${adminPerson(p)}<span>→</span>${receiver?adminPerson(receiver):'<span>추첨 전</span>'}</div></div>`;
  }).join('');
  const messageRows=messages.length?messages.map(x=>{
    const sender=person(x.sender_id),receiver=person(x.receiver_id);
    return `<article class="secret-message"><div><b>${sender?esc(sender.name):esc(x.sender_id)} → ${receiver?esc(receiver.name):esc(x.receiver_id)}</b><small>${adminPartyDate(x.created_at)}</small></div><p>${esc(x.message||'').replace(/\n/g,'<br>')}</p></article>`;
  }).join(''):'<p class="muted">아직 비밀 메시지가 없어.</p>';
  const letterRows=letters.length?letters.map(x=>{
    const sender=person(x.sender_id),receiver=person(x.receiver_id);
    return `<article class="secret-message"><div><b>${sender?esc(sender.name):esc(x.sender_id)} → ${receiver?esc(receiver.name):esc(x.receiver_id)}</b><small>${adminPartyDate(x.created_at)}</small></div><p>${esc(x.message||'').replace(/\n/g,'<br>')}</p></article>`;
  }).join(''):'<p class="muted">아직 우체통 편지가 없어.</p>';
  $('#app').innerHTML=shell(`<section class="card admin"><button id="party-test-back" class="text-back">‹ ADMIN으로</button><span class="mission-kicker">PARTY DAY REHEARSAL</span><h2>파티 당일 예행연습</h2><p class="muted">실제 날짜나 데이터는 바꾸지 않아. 관리자 화면에서만 파티 당일 공개 내용을 미리 점검해.</p><div class="admin-list"><h3>① 마니또 공개</h3>${mapping}</div><div class="admin-list"><h3>② 비밀 메시지 공개 테스트</h3>${messageRows}</div><div class="admin-list"><h3>③ 우체통 개봉 테스트</h3>${letterRows}</div><button id="party-test-exit" class="secondary">예행연습 종료</button></section>`,false);
  $('#party-test-back').onclick=admin;
  $('#party-test-exit').onclick=admin;
}

const adminBeforePartyTools=admin;
admin=function(){
  adminBeforePartyTools();
  const card=document.querySelector('.card.admin');
  const reset=document.querySelector('#reset');
  if(!card||!reset)return;
  const tools=`<div class="admin-party-tools"><h3>파티 점검</h3><button id="admin-mailbox-open" class="secondary" type="button">우체통 확인</button><button id="admin-party-rehearsal" class="secondary" type="button">파티 당일 예행연습</button><p class="small muted">예행연습은 실제 파티 날짜·추첨·편지·메시지 데이터를 변경하지 않아.</p></div>`;
  reset.insertAdjacentHTML('beforebegin',tools);
  $('#admin-mailbox-open').onclick=adminMailbox;
  $('#admin-party-rehearsal').onclick=adminPartyRehearsalPage;
};
