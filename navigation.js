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

// iOS/Safari can occasionally delay or lose click after repeated DOM replacement.
// Normalize a short, stationary touch/pointer gesture into one immediate click for
// every button-like control. Scrolling/dragging is never converted into a click.
let fastTapStart=null;
let fastTapSyntheticTarget=null;
let fastTapSyntheticAt=0;
const FAST_TAP_SELECTOR='button,[role="button"],a[href]';
function fastTapControl(target){
  const control=target?.closest?.(FAST_TAP_SELECTOR);
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return null;
  return control;
}
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse')return;
  const control=fastTapControl(event.target);
  if(!control)return;
  fastTapStart={control,x:event.clientX,y:event.clientY,id:event.pointerId};
},{passive:true,capture:true});
document.addEventListener('pointercancel',()=>{fastTapStart=null},{passive:true,capture:true});
document.addEventListener('pointerup',event=>{
  if(event.pointerType==='mouse'||!fastTapStart||fastTapStart.id!==event.pointerId)return;
  const start=fastTapStart;fastTapStart=null;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.hypot(dx,dy)>12||!document.documentElement.contains(start.control))return;
  const endControl=fastTapControl(event.target);
  if(endControl!==start.control)return;
  fastTapSyntheticTarget=start.control;
  fastTapSyntheticAt=Date.now();
  start.control.click();
},{passive:true,capture:true});
// Suppress only the delayed native click that follows our immediate touch click.
document.addEventListener('click',event=>{
  if(event.detail===0)return; // keyboard/programmatic click
  const control=fastTapControl(event.target);
  if(control&&control===fastTapSyntheticTarget&&Date.now()-fastTapSyntheticAt<700){
    event.preventDefault();
    event.stopImmediatePropagation();
    fastTapSyntheticTarget=null;
  }
},{capture:true});

// Use delegated navigation so it survives every #app re-render.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-go]');
  if(!button)return;
  const page=button.dataset.go;
  if(!page)return;
  event.preventDefault();
  render(page);
});

// Header avatar navigation is also delegated. One click path only: the global fast-tap
// layer above handles touch responsiveness, while mouse/keyboard use the native click.
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
