async function loadMailboxCounts(){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=sender_id,created_at&order=created_at.desc`,{headers:apiHeaders});
 if(!r.ok)throw new Error('mailbox load');
 const rows=await r.json();
 return {total:rows.length,mine:rows.filter(x=>x.sender_id===state.user)};
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
