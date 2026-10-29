async function loadMailboxCounts(){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=sender_id,created_at&order=created_at.desc`,{headers:apiHeaders});
 if(!r.ok)throw new Error('mailbox load');
 const rows=await r.json();
 return {total:rows.length,mine:rows.filter(x=>x.sender_id===state.user)};
}
async function loadAllMailboxLetters(){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters?select=sender_id,receiver_id,mission_id,message,created_at,is_anonymous&order=created_at.asc`,{headers:apiHeaders});
 if(!r.ok)throw new Error('mailbox letters load');return r.json()
}
async function putMailboxLetter(message,missionId){
 await loadGame();
 let receiver=state.user;
 if(missionId===15){receiver=state.assignments&&state.assignments[state.user];if(!receiver)throw new Error('no assignment')}
 const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters`,{method:'POST',headers:apiHeaders,body:JSON.stringify({sender_id:state.user,receiver_id:receiver,mission_id:missionId,message,is_anonymous:false})});
 if(!r.ok)throw new Error('mailbox send');
}
function mailboxMineHtml(rows){
 return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">SEALED MAILBOX</span><h2>나의 우체통</h2></div><b>${rows.length}통</b></div><p class="muted">우체통에 넣은 편지는 연말 파티 전까지 나도 다시 열어볼 수 없어.</p><div class="message-list">${rows.length?rows.map(x=>`<article class="secret-message"><div><b>✉️ 봉인됨</b><small>${formatMessageDate(x.created_at)}</small></div></article>`).join(''):'<p class="muted">아직 넣은 편지가 없어.</p>'}</div></section>`;
}
function freeMailboxMeta(x){
 const raw=String(x&&x.message||'');
 const match=raw.match(/^\[\[FREE_MAILBOX:([^\]]+)\]\]/);
 if(!match)return null;
 return {audience:match[1],message:raw.slice(match[0].length)};
}
function partyMailboxAudience(x){const free=freeMailboxMeta(x);if(free)return free.audience;const d=x.mission_id&&typeof missionDefinition==='function'?missionDefinition(x.mission_id):null;if(d&&d.target==='모두')return 'everyone';if(!x.mission_id&&x.receiver_id===x.sender_id)return 'everyone';return x.receiver_id||''}
function partyMailboxMissionText(x){if(freeMailboxMeta(x))return '';if(!x.mission_id||typeof missionDefinition!=='function')return '';const d=missionDefinition(x.mission_id);if(!d)return '';const title=typeof missionDisplayTitle==='function'?missionDisplayTitle(d):(d.action||'');return title?`<div class="party-letter-mission-text">${esc(title)}</div>`:''}
function partyMailboxLetterHtml(x){const free=freeMailboxMeta(x);const sender=person(x.sender_id),receiver=person(x.receiver_id);const audience=partyMailboxAudience(x);const to=audience==='everyone'?'TO. 모두':`TO. ${receiver?esc(receiver.name):'알 수 없음'}`;const body=free?free.message:(x.message||'');const from=x.is_anonymous?'익명':(sender?esc(sender.name):'알 수 없음');return `<article class="party-letter" data-party-audience="${esc(audience)}"><div class="party-envelope" aria-hidden="true"><span class="party-envelope-holly">🌿</span><span class="party-envelope-berry">●●●</span></div><div class="party-letter-paper"><div class="party-letter-to"><b>${to}</b></div>${partyMailboxMissionText(x)}<p>${esc(body).replace(/\n/g,'<br>')}</p><div class="party-letter-footer"><span>FROM. ${from}</span><time>${formatMessageDate(x.created_at)}</time></div></div></article>`}
function partyMailboxHtml(rows){const counts={everyone:0};PEOPLE.forEach(p=>counts[p.id]=0);rows.forEach(x=>{const key=partyMailboxAudience(x);counts[key]=(counts[key]||0)+1});const filterButton=(id,label,count,active=false)=>`<button type="button" class="${active?'active':''}" data-mailbox-receiver="${id}">${esc(label)} <b>${count}</b></button>`;const filters=`<div class="party-mailbox-filters" role="group" aria-label="수신자 필터">${filterButton('all-letters','전체',rows.length,true)}${filterButton('everyone','모두에게',counts.everyone||0)}${PEOPLE.map(p=>filterButton(p.id,`${p.name}에게`,counts[p.id]||0)).join('')}</div>`;return `<section class="card party-mailbox-open"><div class="party-mailbox-title"><span class="mission-kicker">OPEN MAILBOX</span><div class="party-mailbox-heading"><div><h2>무무클럽 우체통</h2><p>마니또 공개 완료!<br>봉인했던 편지를 열어볼 시간이야.</p></div><div class="party-mailbox-icon" aria-label="편지 ${rows.length}통"><span aria-hidden="true">📮</span><b>${rows.length}</b></div></div>${filters}</div><div class="party-letter-stack">${rows.length?rows.map(partyMailboxLetterHtml).join(''):'<p class="muted">우체통이 비어 있어.</p>'}</div></section>`}
function bindPartyMailboxFilters(){const apply=id=>{document.querySelectorAll('[data-mailbox-receiver]').forEach(x=>x.classList.toggle('active',x.dataset.mailboxReceiver===id));document.querySelectorAll('.party-letter[data-party-audience]').forEach(letter=>{letter.hidden=id==='all-letters'?false:letter.dataset.partyAudience!==id})};document.querySelectorAll('[data-mailbox-receiver]').forEach(button=>button.onclick=()=>apply(button.dataset.mailboxReceiver));apply('all-letters')}
