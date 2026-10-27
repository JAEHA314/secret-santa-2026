// Navigation resilience: dispatch directly to the final route functions after all feature wrappers are loaded.
// This bypasses legacy render wrappers that blank #app while async route data is pending.
const navigationHotfixBaseRender=render;
render=function(page='home'){
  if(!state.user)return login();
  if(page==='home')return home();
  if(page==='mailbox'&&typeof mailboxPage==='function')return mailboxPage();
  if(page==='secret')return secret();
  if(page==='wish')return wish();
  if(page==='me')return me();
  return navigationHotfixBaseRender(page);
};
