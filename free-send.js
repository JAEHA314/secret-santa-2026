async function sendFreeMailboxLetter(message,receiverId='all'){
  const toEveryone=receiverId==='all';
  const receiver=toEveryone?state.user:receiverId;
  if(!receiver||(!toEveryone&&!PEOPLE.some(p=>p.id===receiver)))throw new Error('invalid receiver');
  const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters`,{method:'POST',headers:apiHeaders,body:JSON.stringify({sender_id:state.user,receiver_id:receiver,mission_id:null,message})});
  if(!r.ok)throw new Error('mailbox send');
}

function freeMailboxRecipientPickerHtml(){
  const choices=PEOPLE.filter(p=>p.id!==state.user).map(p=>`<button class="free-mailbox-recipient" type="button" data-mailbox-recipient="${p.id}">${visual(p,'free-mailbox-recipient-img')}<b>${esc(p.name)}</b></button>`).join('');
  return `<div id="free-mailbox-recipient-picker" class="free-mailbox-recipient-picker" hidden><button class="free-mailbox-recipient-backdrop" type="button" data-mailbox-recipient-close aria-label="수신자 선택 닫기"></button><section class="free-mailbox-recipient-sheet" role="dialog" aria-modal="true" aria-labelledby="free-mailbox-recipient-title"><button class="free-mailbox-recipient-close" type="button" data-mailbox-recipient-close aria-label="닫기">×</button><span class="mission-kicker">TO.</span><h3 id="free-mailbox-recipient-title">누구에게 보낼까?</h3><p class="muted">모두에게 보내거나 한 명을 골라줘.</p><div class="free-mailbox-recipient-grid"><button class="free-mailbox-recipient free-mailbox-recipient-all" type="button" data-mailbox-recipient="all"><span aria-hidden="true">💌</span><b>모두</b></button>${choices}</div></section></div>`;
}

function freeSendHtml(){
  return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">WRITE A LETTER</span><h2>편지 쓰기</h2></div></div><textarea id="free-send-text" class="field mission-note" placeholder="미션이 아니어도 언제든 편지를 쓸 수 있어.&#10;쓰고 싶은 내용을 적어줘."></textarea><div class="mission-actions free-send-actions"><button id="free-message-send" class="primary free-message-button">마니또에게<br>익명으로 보내기</button><button id="free-mailbox-send" class="primary free-mailbox-button">수신자를 선택하고<br>우체통에 넣기</button></div>${freeMailboxRecipientPickerHtml()}</section>`;
}
