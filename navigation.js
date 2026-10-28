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

// Use delegated handlers so navigation survives every #app re-render.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-go]');
  if(!button)return;
  const page=button.dataset.go;
  if(!page)return;
  event.preventDefault();
  render(page);
});

// The shared header is rendered repeatedly, so profile navigation must also be delegated.
// Handle pointerdown on the avatar itself for immediate mobile response instead of waiting
// for a later click handler that can be replaced by subsequent bindNav() calls.
let sharedProfilePointerHandled=false;
document.addEventListener('pointerdown',event=>{
  const button=event.target.closest('.shared-profile-link');
  if(!button)return;
  if(event.pointerType==='mouse'&&event.button!==0)return;
  event.preventDefault();
  event.stopPropagation();
  sharedProfilePointerHandled=true;
  render('me');
  window.setTimeout(()=>{sharedProfilePointerHandled=false},350);
},{passive:false});

document.addEventListener('click',event=>{
  const button=event.target.closest('.shared-profile-link');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  if(sharedProfilePointerHandled)return;
  render('me');
});

// Legacy page renderers still call bindNav(). Navigation itself is delegated above;
// keep only controls that need refresh work here. Profile navigation is intentionally
// not rebound per render because the delegated handlers above are authoritative.
function bindNav(){
  document.querySelectorAll('.shared-profile-link').forEach(button=>{button.style.touchAction='manipulation'});
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=()=>showSharedInbox()});
  if(typeof refreshSharedInboxCount==='function')refreshSharedInboxCount();
}
