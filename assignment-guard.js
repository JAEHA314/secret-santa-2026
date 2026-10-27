// Guard SECRET against partial reset states and restore the pre-draw flow.
const assignmentGuardBaseSecret=secret;
function assignmentDrawScreen(){
  $('#app').innerHTML=shell(`<section class="card secret-person-card"><h2>내 마니또를 뽑아볼까?</h2><div class="reveal">🎁</div><button id="draw" class="primary" type="button">마니또 뽑기</button></section>`);
  const main=$('#app .shell');if(main)main.classList.add('secret-page');
  bindNav();
  const draw=$('#draw');
  if(draw)draw.onclick=async()=>{
    draw.disabled=true;
    try{await createAssignmentsIfNeeded();await setDrawn(state.user,true);await secret()}
    catch(e){console.error('assignment draw',e);draw.disabled=false;alert('마니또 추첨에 실패했어. 다시 시도해줘.')}
  };
}
secret=async function(){
  try{
    await loadGame();
    let assignment=state.assignments&&state.assignments[state.user];
    if(state.drawnBy[state.user]&&!assignment){
      try{await setDrawn(state.user,false)}catch(e){delete state.drawnBy[state.user];save()}
      assignment=null;
    }
    if(!state.drawnBy[state.user]){assignmentDrawScreen();return}
  }catch(e){console.warn('assignment state check',e)}
  return assignmentGuardBaseSecret();
};
