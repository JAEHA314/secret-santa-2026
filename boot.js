// Single startup render. Legacy app.js used to render before route overrides loaded,
// which caused obsolete HOME/SECRET screens to flash during startup.
(async function boot(){
  try{
    await loadSharedSettings();
    if(state.user)await loadGame();
  }catch(e){console.warn('boot data',e)}
  render();
})();
