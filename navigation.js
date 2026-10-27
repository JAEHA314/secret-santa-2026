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

// Use one delegated handler so navigation survives every #app re-render.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-go]');
  if(!button)return;
  const page=button.dataset.go;
  if(!page)return;
  event.preventDefault();
  render(page);
});

// Legacy page renderers still call bindNav(). Navigation itself is delegated above;
// this keeps only the shared header controls bound without stacking route handlers.
function bindNav(){
  document.querySelectorAll('.shared-profile-link').forEach(button=>{button.onclick=()=>render('me')});
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=()=>showSharedInbox()});
  if(typeof refreshSharedInboxCount==='function')refreshSharedInboxCount();
}
