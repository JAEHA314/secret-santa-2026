const freeSendBaseMe=me;

async function sendFreeMailboxLetter(message){
  await loadGame();
  const receiver=state.assignments&&state.assignments[state.user];
  if(!receiver)throw new Error('no assignment');
  const r=await fetch(`${SUPABASE_URL}/rest/v1/mailbox_letters`,{method:'POST',headers:apiHeaders,body:JSON.stringify({sender_id:state.user,receiver_id:receiver,mission_id:15,message})});
  if(!r.ok)throw new Error('mailbox send');
}

function freeSendHtml(){
  return `<section class="card"><div class="mission-head"><div><span class="mission-kicker">WRITE A LETTER</span><h2>편지 쓰기</h2></div></div><textarea id="free-send-text" class="field mission-note" placeholder="미션이 아니어도 언제든 편지를 쓸 수 있어.\n쓰고 싶은 내용을 적어줘."></textarea><div class="mission-actions free-send-actions"><button id="free-message-send" class="primary free-message-button">마니또에게<br>익명으로 보내기</button><button id="free-mailbox-send" class="primary free-mailbox-button">우체통에 넣기</button></div><p class="muted" style="margin-top:10px">익명으로 보내면 마니또에게 바로 전달되고, 우체통에 넣으면 연말 파티 날까지 봉인돼.</p></section>`;
}

me=async function(){
  await freeSendBaseMe();
  const main=document.querySelector('main');
  if(!main)return;
  const inbox=[...main.querySelectorAll('.card')].find(x=>x.textContent.includes('익명 메시지함'));
  if(inbox)inbox.insertAdjacentHTML('beforebegin',freeSendHtml());
  else main.insertAdjacentHTML('beforeend',freeSendHtml());
  const messageButton=$('#free-message-send');
  const mailboxButton=$('#free-mailbox-send');
  const text=()=>$('#free-send-text').value.trim();
  if(messageButton)messageButton.onclick=async()=>{
    const value=text();
    if(!value)return alert('보낼 내용을 적어줘.');
    messageButton.disabled=true;
    try{await sendSecretMessage(value,null);alert('마니또에게 익명으로 보냈어!');me()}catch(e){messageButton.disabled=false;alert('메시지를 보내지 못했어. 다시 시도해줘.')}
  };
  if(mailboxButton)mailboxButton.onclick=async()=>{
    const value=text();
    if(!value)return alert('편지 내용을 적어줘.');
    if(!confirm('✉️ 우체통에 넣으면 연말 파티 전까지 본인도 다시 열어보거나 수정할 수 없어요.\n\n정말 우체통에 넣을까요?'))return;
    mailboxButton.disabled=true;
    try{await sendFreeMailboxLetter(value);alert('편지를 우체통에 넣었어! 연말 파티 날 다시 만나자.');me()}catch(e){mailboxButton.disabled=false;alert('편지를 넣지 못했어. 다시 시도해줘.')}
  };
};
