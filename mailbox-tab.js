const mailboxTabBaseShell=shell;
const mailboxTabBaseRender=render;

shell=function(body,nav=true){
  if(!nav)return mailboxTabBaseShell(body,false);
  const html=mailboxTabBaseShell(body,true);
  return html
    .replace('<button data-go="home"><b>⌂</b>HOME</button>','<button data-go="home"><b>🏠</b>HOME</button>')
    .replace('<button data-go="secret"><b>✦</b>SECRET</button>','<button data-go="mailbox"><b>✉️</b>MAIL</button><button data-go="secret"><b>🎅</b>SECRET</button>')
    .replace('<button data-go="wish"><b>♡</b>WISH</button>','<button data-go="wish"><b>❤️</b>WISH</button>')
    .replace('<button data-go="me"><b>☺</b>ME</button>','');
};

render=function(page='home'){
  if(!state.user)return login();
  if(page==='mailbox')return mailboxPage();
  return mailboxTabBaseRender(page);
};

function mailboxSummaryHtml(total){
  return `<section class="card mailbox-summary"><span class="mission-kicker">MOOMOO MAILBOX</span><h2>무무클럽 우체통</h2><div class="mailbox-hero" aria-label="지금까지 모인 편지 ${total}통"><span class="mailbox-hero-icon" aria-hidden="true">📮</span><b class="mailbox-hero-badge">${total}</b></div><div class="mailbox-sealed-copy"><p class="muted">연말 파티 전까지 편지는 봉인되어 있어.</p><p class="muted">마니또 공개 뒤 다같이 열어보자!</p></div></section>`;
}

async function mailboxPage(){
  $('#app').innerHTML=shell(`<div class="route-placeholder" aria-hidden="true"></div>`);
  if(typeof partyContentUnlocked==='function'&&await partyContentUnlocked()){
    try{const rows=await loadAllMailboxLetters();$('#app').innerHTML=shell(partyMailboxHtml(rows));const main=document.querySelector('main');if(main)main.classList.add('mailbox-page','party-mailbox-page');bindNav();return}catch(e){console.warn('party mailbox',e)}
  }
  let box={total:0,mine:[]};
  try{box=await loadMailboxCounts()}catch(e){console.warn(e)}
  const summary=mailboxSummaryHtml(box.total).replace('</section>',`<p class="muted mailbox-my-count">내가 넣은 편지 <b>${box.mine.length}통</b></p></section>`);
  $('#app').innerHTML=shell(`${summary}${freeSendHtml()}`);
  const main=document.querySelector('main');
  if(main)main.classList.add('mailbox-page');
  const compose=document.querySelector('#free-send-text')?.closest('.card');
  if(compose)compose.classList.add('compose-card');
  bindNav();
  bindMailboxCompose(()=>mailboxPage());
}

function bindMailboxCompose(refresh){
  const messageButton=$('#free-message-send');
  const mailboxButton=$('#free-mailbox-send');
  const text=()=>$('#free-send-text')?$('#free-send-text').value.trim():'';
  if(messageButton)messageButton.onclick=async()=>{
    const value=text();
    if(!value)return alert('보낼 내용을 적어줘.');
    messageButton.disabled=true;
    try{await sendSecretMessage(value,null);alert('마니또에게 익명으로 보냈어!');refresh()}catch(e){messageButton.disabled=false;alert('메시지를 보내지 못했어. 다시 시도해줘.')}
  };
  if(mailboxButton)mailboxButton.onclick=async()=>{
    const value=text();
    if(!value)return alert('편지 내용을 적어줘.');
    if(!confirm('✉️ 우체통에 넣으면 연말 파티 전까지 본인도 다시 열어보거나 수정할 수 없어요.\n\n정말 우체통에 넣을까요?'))return;
    mailboxButton.disabled=true;
    try{await sendFreeMailboxLetter(value);alert('편지를 우체통에 넣었어! 연말 파티 날 다시 만나자.');refresh()}catch(e){mailboxButton.disabled=false;alert('편지를 넣지 못했어. 다시 시도해줘.')}
  };
}
