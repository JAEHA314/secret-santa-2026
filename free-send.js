async function sendFreeMailboxLetter(message){
  await loadGame();
  const receiver=state.assignments&&state.assignments[state.user];
  if(!receiver)throw new Error('no assignment');
  const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters`,{method:'POST',headers:apiHeaders,body:JSON.stringify({sender_id:state.user,receiver_id:receiver,mission_id:15,message})});
  if(!r.ok)throw new Error('mailbox send');
}

function freeSendHtml(){
  return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">WRITE A LETTER</span><h2>편지 쓰기</h2></div></div><textarea id="free-send-text" class="field mission-note" placeholder="미션이 아니어도 언제든 편지를 쓸 수 있어.&#10;쓰고 싶은 내용을 적어줘."></textarea><div class="mission-actions free-send-actions"><button id="free-message-send" class="primary free-message-button">마니또에게<br>익명으로 보내기</button><button id="free-mailbox-send" class="primary free-mailbox-button">우체통에 넣기</button></div></section>`;
}
