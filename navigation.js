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

// One authoritative mobile tap path.
// iOS/Safari may delay or lose a native click when the tapped element is replaced by
// the page renderer. Convert a short stationary pointer gesture into a click ourselves
// and prevent the browser from emitting a second delayed click at the same position.
let tapGesture=null;
const TAP_SELECTOR='button,[role="button"],a[href]';
function tappableControl(target){
  const control=target?.closest?.(TAP_SELECTOR);
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return null;
  return control;
}
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||!event.isPrimary)return;
  const control=tappableControl(event.target);
  if(!control)return;
  tapGesture={control,id:event.pointerId,x:event.clientX,y:event.clientY};
},{capture:true,passive:true});
document.addEventListener('pointercancel',()=>{tapGesture=null},{capture:true,passive:true});
document.addEventListener('pointerup',event=>{
  if(event.pointerType==='mouse'||!event.isPrimary||!tapGesture||tapGesture.id!==event.pointerId)return;
  const start=tapGesture;
  tapGesture=null;
  const dx=event.clientX-start.x;
  const dy=event.clientY-start.y;
  if(Math.hypot(dx,dy)>14||!document.documentElement.contains(start.control))return;
  if(tappableControl(event.target)!==start.control)return;
  // Prevent Safari's follow-up native click. The synchronous .click() below is the
  // single event seen by page handlers, so controls never need a second tap.
  event.preventDefault();
  start.control.click();
},{capture:true,passive:false});

// Use delegated navigation so it survives every #app re-render.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-go]');
  if(!button)return;
  const page=button.dataset.go;
  if(!page)return;
  event.preventDefault();
  render(page);
});

// Header avatar navigation is delegated and survives every page replacement.
document.addEventListener('click',event=>{
  const button=event.target.closest('.shared-profile-link');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  render('me');
});

// Legacy page renderers still call bindNav(). Navigation itself is delegated above;
// keep only controls that need refresh work here.
function bindNav(){
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=()=>showSharedInbox()});
  if(typeof refreshSharedInboxCount==='function')refreshSharedInboxCount();
}
