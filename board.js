const BOARD_MISSION_IDS=[18,19,20,21,22];

async function loadBoardPosts(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/board_posts?select=id,player_id,mission_id,content,created_at&order=created_at.desc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('board load');
  return r.json();
}

async function createBoardPost(content,missionId=null){
  const payload={player_id:state.user,content};
  if(missionId)payload.mission_id=missionId;
  const r=await fetch(`${SUPABASE_URL}/rest/v1/board_posts`,{method:'POST',headers:apiHeaders,body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('board post');
}

function boardMissionTitle(id){
  if(id==null)return '자유롭게 남긴 이야기';
  const m=MISSIONS.find(x=>x.id===Number(id));
  return m?m.title:'무무클럽 이야기';
}

function boardPreviewHtml(posts){
  return `<button id="open-board" class="card board-preview" type="button"><div><span class="mission-kicker">MOOMOO BOARD</span><h2>무무클럽 칠판</h2><p>우리의 제안을 한곳에 모아봐.</p></div><strong>${posts.length}개 ›</strong></button>`;
}

async function boardPage(){
  let posts=[];
  try{posts=await loadBoardPosts()}catch(e){console.warn(e)}
  const notes=posts.length?posts.map(x=>{
    const p=person(x.player_id);
    return `<article class="chalk-note"><div class="chalk-author">${p?visual(p,'board-avatar'):''}<span>${p?esc(p.name):'무무클럽'}</span></div><small>${esc(boardMissionTitle(x.mission_id))}</small><p>${esc(x.content).replace(/\n/g,'<br>')}</p></article>`;
  }).join(''):`<div class="chalk-empty">아직 칠판이 비어 있어.<br>첫 이야기를 남겨봐!</div>`;
  $('#app').innerHTML=shell(`<button id="board-back" class="text-back">‹ HOME으로</button><section class="chalk-frame"><div class="chalkboard"><div class="chalk-heading"><span>MOOMOO CLUB</span><h2>우리의 칠판</h2><b>${posts.length}개의 이야기</b></div><div class="chalk-compose"><textarea id="board-free-text" maxlength="300" placeholder="무무클럽 칠판에 자유롭게 남겨봐."></textarea><button id="board-free-post" type="button">분필로 적기</button></div><div class="chalk-notes">${notes}</div><div class="chalk-tray"><i></i><i></i><i></i></div></div></section>`);
  const main=document.querySelector('main');if(main)main.classList.add('board-page');
  bindNav();
  $('#board-back').onclick=home;
  $('#board-free-post').onclick=async()=>{
    const text=$('#board-free-text').value.trim();
    if(!text)return alert('칠판에 남길 내용을 적어줘.');
    const button=$('#board-free-post');button.disabled=true;
    try{await createBoardPost(text,null);await boardPage()}catch(e){button.disabled=false;alert('칠판에 올리지 못했어. 다시 시도해줘.')}
  };
}

// HOME에 칠판 입구를 추가한다.
const boardBaseHome=home;
home=async function(){
  await boardBaseHome();
  let posts=[];try{posts=await loadBoardPosts()}catch(e){console.warn(e)}
  const stats=document.querySelector('.stats');
  if(stats){stats.insertAdjacentHTML('beforebegin',boardPreviewHtml(posts));$('#open-board').onclick=boardPage;}
};

// BOARD 미션은 기록을 완료하는 순간 공동 칠판에도 게시한다.
const boardBaseSecret=secret;
secret=async function(){
  await boardBaseSecret();
  const rows=await loadMissions().catch(()=>[]);
  const current=rows.find(x=>x.status==='pending');
  const mission=current&&MISSIONS.find(x=>x.id===Number(current.mission_id));
  if(!mission||mission.type!=='board')return;
  const note=$('#mission-note');
  const complete=$('#mission-complete');
  if(note)note.placeholder='칠판에 남길 제안을 적어줘';
  if(complete){
    complete.textContent='칠판에 붙이기';
    complete.onclick=async()=>{
      const value=note?note.value.trim():'';
      if(!value)return alert('칠판에 남길 내용을 적어줘.');
      complete.disabled=true;
      try{
        await createBoardPost(value,mission.id);
        await completeMission(current,value);
        alert('무무클럽 칠판에 붙였어!');
        secret();
      }catch(e){
        complete.disabled=false;
        alert('칠판에 올리지 못했어. 다시 시도해줘.');
      }
    };
  }
};