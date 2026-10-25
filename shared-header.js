// Shared logged-in header: title + greeting/profile on every main tab.
const sharedHeaderBaseShell=shell;

shell=function(body,nav=true){
  const html=sharedHeaderBaseShell(body,nav);
  if(!nav||!state.user)return html;
  const u=person(state.user);
  if(!u)return html;
  const greeting=`<button class="shared-profile-link" type="button" aria-label="내 화면 열기"><span class="shared-greeting"><small>안녕,</small><b>${esc(u.name)}!</b></span><span class="shared-avatar">${visual(u,'avatar-img')}</span></button>`;
  return html.replace('<div class="brand">',`<div class="shared-header"><div class="brand">`).replace('</h1></div>',`</h1></div>${greeting}</div>`);
};

const sharedHeaderBaseBindNav=bindNav;
bindNav=function(){
  sharedHeaderBaseBindNav();
  document.querySelectorAll('.shared-profile-link').forEach(button=>{
    button.onclick=()=>render('me');
  });
};

// On the personal page, keep the title but hide the redundant greeting/profile shortcut.
const sharedHeaderBaseMe=me;
me=async function(){
  await sharedHeaderBaseMe();
  const main=document.querySelector('main');
  if(main)main.classList.add('personal-page');
};
