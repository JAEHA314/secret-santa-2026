// Temporary compatibility guard for legacy/partial reset states. This will be absorbed into the SECRET renderer in the second structural split.
const assignmentGuardBaseSecret=secret;
secret=async function(){
  try{
    await loadGame();
    const assignment=state.assignments&&state.assignments[state.user];
    if(state.drawnBy[state.user]&&!assignment){
      try{await setDrawn(state.user,false)}catch(e){delete state.drawnBy[state.user];save()}
    }
  }catch(e){console.warn('assignment state check',e)}
  return assignmentGuardBaseSecret();
};
