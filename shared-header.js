// Shared logged-in header: title + greeting/profile + secret inbox shortcut on every main tab.
const sharedHeaderBaseShell=shell;

const sharedHeaderNameColors={
  bear:'#6fa9c7',
  dog:'#d6a62a',
  frog:'#4f9a65',
  cat:'#77736f',
  rabbit:'#d9869d',
  glasses:'#9474ad'
};

shell=function(body,nav=true){
  const html=sharedHeaderBaseShell(body,nav);
  if(!nav||!state.user)return html;
  const u=person(state.user);
  if(!u)return html;
  const nameColor=sharedHeaderNameColors[state.user]||'inherit';
  const greeting=`<div class="shared-user-tools"><button class="shared-profile-link" type="button" aria-label="내 화면 열기"><span class="shared-greeting"><small>안녕,</small><b style="color:${nameColor}">${esc(u.name)}!</b></span><span class="shared-avatar">${visual(u,'avatar-img')}</span></button><button class="shared-inbox-link" type="button" aria-label="받은 익명 메시지 보기"><span aria-hidden="true">💌</span><b class="shared-inbox-count">0</b></button></div>`;
  return html.replace('<div class="brand">',`<div class="shared-header"><div class="brand">`).replace('</h1></div>',`</h1></div>${greeting}</div>`);
};

async function refreshSharedInboxCount(){
  const badge=document.querySelector('.shared-inbox-count');
  if(!badge||typeof loadSecretMessages!=='function')return;
  try{
    const messages=await loadSecretMessages();
    if(document.body.contains(badge))badge.textContent=messages.length;
  }catch(e){console.warn('shared inbox count',e)}
}

function openSharedInbox(messages){
  const list=secretInboxHtml(messages);
  $('#app').innerHTML=shell(`<button id="shared-inbox-back" class="text-back" type="button">← 돌아가기</button>${list}`);
  bindNav();
  const back=$('#shared-inbox-back');
  if(back)back.onclick=()=>render('home');
}

async function showSharedInbox(){
  let messages=[];
  try{messages=await loadSecretMessages()}catch(e){console.warn(e)}
  openSharedInbox(messages);
}

const sharedHeaderBaseBindNav=bindNav;
bindNav=function(){
  sharedHeaderBaseBindNav();
  document.querySelectorAll('.shared-profile-link').forEach(button=>{
    button.onclick=()=>render('me');
  });
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{
    button.onclick=showSharedInbox;
  });
  refreshSharedInboxCount();
};

// On the personal page, keep the title but hide only the redundant greeting/profile shortcut.
const sharedHeaderBaseMe=me;
me=async function(){
  await sharedHeaderBaseMe();
  const main=document.querySelector('main');
  if(main)main.classList.add('personal-page');
};
