const mailboxTabBaseShell=shell;
const mailboxTabBaseRender=render;

shell=function(body,nav=true){
  if(!nav)return mailboxTabBaseShell(body,false);
  const html=mailboxTabBaseShell(body,true);
  return html.replace('<button data-go="secret"><b>✦</b>SECRET</button>','<button data-go="mailbox"><b>✉</b>MAILBOX</button><button data-go="secret"><b>✦</b>SECRET</button>');
};

render=function(page='home'){
  if(!state.user)return login();
  if(page==='mailbox')return mailboxPage();
  return mailboxTabBaseRender(page);
};

async function mailboxPage(){
  let box={total:0,mine:[]};
  try{box=await loadMailboxCounts()}catch(e){console.warn(e)}
  $('#app').innerHTML=shell(`${mailboxSummaryHtml(box.total)}${freeSendHtml()}`);
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

// HOME에서는 공동 우체통 카드를 제거하고, MAILBOX 탭에서만 보여준다.
const mailboxTabHome=home;
home=async function(){
  await mailboxTabHome();
  const card=[...document.querySelectorAll('.mailbox-summary')];
  card.forEach(x=>x.remove());
};

// ME에서는 편지쓰기 카드를 제거하고 기존 익명 메시지함/나의 봉인 편지만 유지한다.
const mailboxTabMe=me;
me=async function(){
  await mailboxTabMe();
  const cards=[...document.querySelectorAll('main .card')];
  const compose=cards.find(x=>x.querySelector('#free-send-text'));
  if(compose)compose.remove();
};