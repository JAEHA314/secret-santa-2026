async function loadMailboxCounts(){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=sender_id,created_at&order=created_at.desc`,{headers:apiHeaders});
 if(!r.ok)throw new Error('mailbox load');
 const rows=await r.json();
 return {total:rows.length,mine:rows.filter(x=>x.sender_id===state.user)};
}
async function loadAllMailboxLetters(){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=sender_id,receiver_id,mission_id,message,created_at&order=created_at.asc`,{headers:apiHeaders});
 if(!r.ok)throw new Error('mailbox letters load');return r.json()
}
async function putMailboxLetter(message,missionId){
 await loadGame();
 let receiver=state.user;
 if(missionId===15){receiver=state.assignments&&state.assignments[state.user];if(!receiver)throw new Error('no assignment')}
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters`,{method:'POST',headers:apiHeaders,body:JSON.stringify({sender_id:state.user,receiver_id:receiver,mission_id:missionId,message})});
 if(!r.ok)throw new Error('mailbox send');
}
function mailboxMineHtml(rows){
 return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">SEALED MAILBOX</span><h2>나의 우체통</h2></div><b>${rows.length}통</b></div><p class="muted">우체통에 넣은 편지는 연말 파티 전까지 나도 다시 열어볼 수 없어.</p><div class="message-list">${rows.length?rows.map(x=>`<article class="secret-message"><div><b>✉️ 봉인됨</b><small>${formatMessageDate(x.created_at)}</small></div></article>`).join(''):'<p class="muted">아직 넣은 편지가 없어.</p>'}</div></section>`;
}
function partyMailboxLetterHtml(x){const sender=person(x.sender_id),receiver=person(x.receiver_id);return `<article class="secret-message party-letter"><div><b>${sender?esc(sender.name):'알 수 없음'}${receiver&&receiver.id!==sender?.id?` → ${esc(receiver.name)}`:''}</b><small>${formatMessageDate(x.created_at)}</small></div><p>${esc(x.message||'').replace(/\n/g,'<br>')}</p></article>`}
function partyMailboxHtml(rows){return `<section class="card party-mailbox-open"><div class="mission-head"><div><span class="mission-kicker">OPEN MAILBOX</span><h2>우리의 우체통</h2></div><b>${rows.length}통</b></div><p class="muted">마니또 공개가 모두 끝나 우체통의 봉인이 풀렸어.</p><div class="message-list">${rows.length?rows.map(partyMailboxLetterHtml).join(''):'<p class="muted">우체통이 비어 있어.</p>'}</div></section>`}
