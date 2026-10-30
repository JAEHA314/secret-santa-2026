// Authoritative route dispatcher. Loaded after all page modules so route functions are final.
function render(page='home'){
  if(!state.user)return login();
  if(page==='home')return home();
  if(page==='mailbox')return typeof mailboxPage==='function'?mailboxPage():home();
  if(page==='secret')return secret();
  if(page==='wish')return wish();
  if(page==='me')return me();
  return home();
}

// Keep browser-native click/focus behaviour. In particular, do not synthesize clicks
// from pointerup: on iOS that can steal focus from inputs/textareas and can double-fire
// controls that have their own pointer handlers.
let lastNavAt=0,lastNavPage='';
function acceptNav(page){const now=Date.now();if(page===lastNavPage&&now-lastNavAt<450)return false;lastNavAt=now;lastNavPage=page;return true}

// Delegated navigation survives every #app re-render.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-go]');
  if(!button||button.disabled)return;
  const page=button.dataset.go;
  if(!page)return;
  event.preventDefault();
  if(!acceptNav(page))return;
  render(page);
});

// Header avatar navigation is delegated and survives every page replacement.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('.shared-profile-link');
  if(!button||button.disabled)return;
  event.preventDefault();
  event.stopPropagation();
  if(!acceptNav('me'))return;
  render('me');
});

// Legacy page renderers still call bindNav(). Navigation itself is delegated above;
// keep only controls that need refresh work here. Avoid repeating the same inbox
// request when a page performs an immediate placeholder -> final render.
let sharedInboxCountRefreshAt=0;
function bindNav(){
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=()=>showSharedInbox()});
  const now=Date.now();
  if(typeof refreshSharedInboxCount==='function'&&now-sharedInboxCountRefreshAt>4000){sharedInboxCountRefreshAt=now;refreshSharedInboxCount()}
}
