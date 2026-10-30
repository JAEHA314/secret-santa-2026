// Authoritative route dispatcher. Loaded after all page modules so route functions are final.
let routeLoadingToken=0,routeLoadingTimer=null;
function ensureRouteLoadingStyles(){
  if(document.getElementById('route-loading-style'))return;
  const style=document.createElement('style');
  style.id='route-loading-style';
  style.textContent=`.route-loading{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(247,241,231,.38);backdrop-filter:blur(1.5px);-webkit-backdrop-filter:blur(1.5px);opacity:0;pointer-events:none;transition:opacity .12s ease}.route-loading.is-visible{opacity:1;pointer-events:auto}.route-loading-box{display:flex;align-items:center;gap:9px;padding:10px 14px;border:1px solid rgba(82,66,51,.12);border-radius:999px;background:rgba(255,252,247,.94);box-shadow:0 4px 16px rgba(55,42,29,.10);color:#5d554d;font-size:12px;font-weight:700}.route-loading-spinner{width:15px;height:15px;border:2px solid rgba(93,85,77,.18);border-top-color:#8f2528;border-radius:50%;animation:route-spin .7s linear infinite}@keyframes route-spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}
function beginRouteLoading(){
  const token=++routeLoadingToken;
  clearTimeout(routeLoadingTimer);
  routeLoadingTimer=setTimeout(()=>{
    if(token!==routeLoadingToken)return;
    ensureRouteLoadingStyles();
    let el=document.getElementById('route-loading');
    if(!el){
      el=document.createElement('div');
      el.id='route-loading';
      el.className='route-loading';
      el.setAttribute('aria-live','polite');
      el.innerHTML='<div class="route-loading-box"><span class="route-loading-spinner"></span><span>불러오는 중...</span></div>';
      document.body.appendChild(el);
    }
    requestAnimationFrame(()=>el.classList.add('is-visible'));
  },180);
  return token;
}
function endRouteLoading(token){
  if(token!==routeLoadingToken)return;
  clearTimeout(routeLoadingTimer);
  routeLoadingTimer=null;
  const el=document.getElementById('route-loading');
  if(el)el.classList.remove('is-visible');
}
function render(page='home'){
  if(!state.user)return login();
  const token=beginRouteLoading();
  let result;
  try{
    if(page==='home')result=home();
    else if(page==='mailbox')result=typeof mailboxPage==='function'?mailboxPage():home();
    else if(page==='secret')result=secret();
    else if(page==='wish')result=wish();
    else if(page==='me')result=me();
    else result=home();
  }catch(error){
    endRouteLoading(token);
    throw error;
  }
  if(result&&typeof result.then==='function'){
    return result.finally(()=>endRouteLoading(token));
  }
  endRouteLoading(token);
  return result;
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

// Legacy page renderers still call bindNav(). Navigation itself is delegated above.
// refreshSharedInboxCount deduplicates its own in-flight request and immediately paints
// the cached count into newly rendered headers, so placeholder/final rerenders stay correct.
function bindNav(){
  document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=()=>showSharedInbox()});
  if(typeof refreshSharedInboxCount==='function')refreshSharedInboxCount();
}
