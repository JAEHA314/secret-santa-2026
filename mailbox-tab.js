const mailboxTabBaseShell=shell;

// Extend only the shared shell. Route dispatch is owned by navigation.js.
shell=function(body,nav=true){
  if(!nav)return mailboxTabBaseShell(body,false);
  const html=mailboxTabBaseShell(body,true);
  return html
    .replace('<button data-go="home"><b>⌂</b>HOME</button>','<button data-go="home"><b>🏠</b>HOME</button>')
    .replace('<button data-go="secret"><b>✦</b>SECRET</button>','<button data-go="mailbox"><b>✉️</b>MAIL</button><button data-go="secret"><b>🎅</b>SECRET</button>')
    .replace('<button data-go="wish"><b>♡</b>WISH</button>','<button data-go="wish"><b>❤️</b>WISH</button>')
    .replace('<button data-go="me"><b>☺</b>ME</button>','');
};

function mailboxSummaryHtml(total){
  return `<section class="card mailbox-summary"><span class="mission-kicker">MOOMOO MAILBOX</span><h2>무무클럽 우체통</h2><div class="mailbox-hero" aria-label="지금까지 모인 편지 ${total}통"><span class="mailbox-hero-icon" aria-hidden="true">📮</span><b class="mailbox-hero-badge">${total}</b></div><div class="mailbox-sealed-copy"><p class="muted">연말 파티 전까지 편지는 봉인되어 있어.</p><p class="muted">마니또 공개 뒤 다같이 열어보자!</p></div></section>`;
}

function mailboxDrawLockedHtml(){
  return `<section class="card compose-card mailbox-draw-locked"><span class="mission-kicker">WRITE A LETTER</span><h2>편지 쓰기</h2><p class="muted">마니또를 뽑은 뒤부터 편지를 쓸 수 있어.</p><button class="primary" type="button" data-go="secret">마니또 뽑으러 가기</button></section>`;
}

async function mailboxPage(){
  $('#app').innerHTML=shell(`<div class="route-placeholder" aria-hidden="true"></div>`);
  try{await loadGame()}catch(e){console.warn('mailbox game state',e)}
  if(typeof partyContentUnlocked==='function'&&await partyContentUnlocked()){
    try{
      // The party mailbox must resolve mission labels from the shared Supabase definitions,
      // not from the bundled defaults. This keeps admin-edited mission text in sync.
      if(typeof loadMissionDefinitions==='function')await loadMissionDefinitions();
      const rows=await loadAllMailboxLetters();
      $('#app').innerHTML=shell(partyMailboxHtml(rows));
      const main=document.querySelector('main');if(main)main.classList.add('mailbox-page','party-mailbox-page');
      bindNav();if(typeof bindPartyMailboxFilters==='function')bindPartyMailboxFilters();return
    }catch(e){console.warn('party mailbox',e)}
  }
  let box={total:0,mine:[]};
  try{box=await loadMailboxCounts()}catch(e){console.warn(e)}
  const summary=mailboxSummaryHtml(box.total).replace('</section>',`<p class="muted mailbox-my-count">내가 넣은 편지 <b>${box.mine.length}통</b></p></section>`);
  const hasDrawn=Boolean(state.drawnBy&&state.drawnBy[state.user]);
  $('#app').innerHTML=shell(`${summary}${hasDrawn?freeSendHtml():mailboxDrawLockedHtml()}`);
  const main=document.querySelector('main');
  if(main)main.classList.add('mailbox-page');
  const compose=document.querySelector('#free-send-text')?.closest('.card');
  if(compose)compose.classList.add('compose-card');
  bindNav();
  if(hasDrawn)bindMailboxCompose(()=>mailboxPage());
}

function bindMailboxCompose(refresh){
  const messageButton=$('#free-message-send');
  const mailboxButton=$('#free-mailbox-send');
  const picker=$('#free-mailbox-recipient-picker');
  const text=()=>$('#free-send-text')?$('#free-send-text').value.trim():'';
  const closePicker=()=>{if(picker)picker.hidden=true};
  if(messageButton)messageButton.onclick=async()=>{
    const value=text();
    if(!value)return alert('보낼 내용을 적어줘.');
    messageButton.disabled=true;
    try{await sendSecretMessage(value,null);alert('마니또에게 익명으로 보냈어!');refresh()}catch(e){messageButton.disabled=false;alert('메시지를 보내지 못했어. 다시 시도해줘.')}
  };
  if(mailboxButton)mailboxButton.onclick=()=>{
    if(!text())return alert('편지 내용을 적어줘.');
    if(picker)picker.hidden=false;
  };
  document.querySelectorAll('[data-mailbox-recipient-close]').forEach(button=>button.onclick=closePicker);
  let sending=false;
  const chooseRecipient=async button=>{
    if(sending)return;
    const value=text();
    if(!value){closePicker();return alert('편지 내용을 적어줘.')}
    const receiverId=button.dataset.mailboxRecipient;
    const receiver=receiverId==='all'?null:person(receiverId);
    const recipientLabel=receiverId==='all'?'모두':receiver?.name;
    const anonymous=Boolean(document.querySelector('#free-mailbox-anonymous')?.checked);
    if(!recipientLabel)return alert('수신자를 찾지 못했어.');
    const anonymousLine=anonymous?'\n\n익명 편지라서 우체통이 열린 뒤에도 보낸 사람 이름은 공개되지 않아.':'';
    if(!confirm(`✉️ ${recipientLabel}에게 보내는 편지를 우체통에 넣을까?\n\n연말 파티 전까지 다시 열거나 수정할 수 없어.${anonymousLine}`))return;
    sending=true;
    document.querySelectorAll('[data-mailbox-recipient]').forEach(x=>x.disabled=true);
    if(mailboxButton)mailboxButton.disabled=true;
    try{await sendFreeMailboxLetter(value,receiverId,anonymous);closePicker();alert(`${recipientLabel}에게 보낼 ${anonymous?'익명 ':''}편지를 우체통에 넣었어!`);refresh()}catch(e){console.error(e);sending=false;document.querySelectorAll('[data-mailbox-recipient]').forEach(x=>x.disabled=false);if(mailboxButton)mailboxButton.disabled=false;alert('편지를 넣지 못했어. 다시 시도해줘.')}
  };
  document.querySelectorAll('[data-mailbox-recipient]').forEach(button=>{
    button.onclick=()=>chooseRecipient(button);
  });
}
