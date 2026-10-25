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

async function deleteFreeBoardPost(id){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/board_posts?id=eq.${encodeURIComponent(id)}&player_id=eq.${encodeURIComponent(state.user)}&mission_id=is.null`,{method:'DELETE',headers:apiHeaders});
  if(!r.ok)throw new Error('board delete');
}

function boardMissionTitle(id){
  if(id==null)return '자유롭게 남긴 이야기';
  const m=MISSIONS.find(x=>x.id===Number(id));
  return m?m.title:'무무클럽 이야기';
}

function boardDate(value){
  if(!value)return '';
  const d=new Date(value);
  return `${d.getMonth()+1}.${d.getDate()}`;
}

function boardFullDate(value){
  if(!value)return '';
  const d=new Date(value);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function boardPreviewHtml(posts){
  return `<button id="open-board" class="card board-preview" type="button"><h2>무무클럽 칠판</h2><strong>${posts.length}개 ›</strong></button>`;
}

function stickyColorClass(playerId){return `sticky-${playerId||'default'}`}

function openBoardPost(post){
  const p=person(post.player_id);
  const canDelete=post.mission_id==null&&post.player_id===state.user;
  const modal=document.createElement('div');
  modal.className='board-modal';
  modal.innerHTML=`<div class="board-modal-backdrop" data-close-board-modal></div><article class="board-modal-note ${stickyColorClass(post.player_id)}"><button class="board-modal-close" data-close-board-modal type="button" aria-label="닫기">×</button><div class="board-modal-meta"><b>${p?esc(p.name):'무무클럽'}</b><span>${esc(boardMissionTitle(post.mission_id))}</span><time>${boardFullDate(post.created_at)}</time></div><p>${esc(post.content).replace(/\n/g,'<br>')}</p>${canDelete?`<button class="board-modal-delete" type="button">이 글 삭제하기</button>`:''}</article>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-board-modal]').forEach(x=>x.onclick=()=>modal.remove());
  const del=modal.querySelector('.board-modal-delete');
  if(del)del.onclick=async()=>{
    if(!confirm('이 자유 글을 칠판에서 지울까?'))return;
    del.disabled=true;
    try{await deleteFreeBoardPost(post.id);modal.remove();await boardPage()}catch(e){del.disabled=false;alert('글을 삭제하지 못했어. 다시 시도해줘.')}
  };
}

async function boardPage(){
  let posts=[];
  try{posts=await loadBoardPosts()}catch(e){console.warn(e)}
  const notes=posts.length?posts.map((x,i)=>{
    const preview=x.content.length>18?`${x.content.slice(0,18)}…`:x.content;
    return `<button class="sticky-note ${stickyColorClass(x.player_id)} sticky-tilt-${i%5}" data-board-post="${x.id}" type="button"><time>${boardDate(x.created_at)}</time><p>${esc(preview)}</p></button>`;
  }).join(''):`<div class="chalk-empty">아직 칠판이 비어 있어.<br>첫 포스트잇을 붙여봐!</div>`;
  $('#app').innerHTML=shell(`<button id="board-back" class="text-back">‹ HOME으로</button><section class="chalk-frame"><div class="chalkboard"><div class="chalk-heading"><h2>무무클럽 칠판</h2></div><div class="chalk-notes sticky-grid">${notes}</div><div class="chalk-tray"><i></i><i></i><i></i></div></div></section><section class="board-compose-card"><div><span class="mission-kicker">FREE NOTE</span><h3>포스트잇 붙이기</h3></div><textarea id="board-free-text" maxlength="300" placeholder="무무클럽 칠판에 자유롭게 남겨봐."></textarea><button id="board-free-post" class="primary" type="button">포스트잇 붙이기</button></section>`);
  const main=document.querySelector('main');if(main)main.classList.add('board-page');
  bindNav();
  $('#board-back').onclick=home;
  $('#board-free-post').onclick=async()=>{
    const text=$('#board-free-text').value.trim();
    if(!text)return alert('칠판에 남길 내용을 적어줘.');
    const button=$('#board-free-post');button.disabled=true;
    try{await createBoardPost(text,null);await boardPage()}catch(e){button.disabled=false;alert('칠판에 올리지 못했어. 다시 시도해줘.')}
  };
  document.querySelectorAll('[data-board-post]').forEach(button=>button.onclick=()=>{
    const post=posts.find(x=>String(x.id)===String(button.dataset.boardPost));
    if(post)openBoardPost(post);
  });
}

const boardBaseHome=home;
home=async function(){
  await boardBaseHome();
  let posts=[];try{posts=await loadBoardPosts()}catch(e){console.warn(e)}
  const stats=document.querySelector('.stats');
  if(stats){stats.insertAdjacentHTML('beforebegin',boardPreviewHtml(posts));$('#open-board').onclick=boardPage;}
};

const boardBaseSecret=secret;
secret=async function(){
  await boardBaseSecret();
  const rows=await loadMissions().catch(()=>[]);
  const current=rows.find(x=>x.status==='pending');
  const mission=current&&MISSIONS.find(x=>x.id===Number(current.mission_id));
  if(!mission||mission.type!=='board')return;
  const note=$('#mission-note');
  const complete=$('#mission-complete');
  if(note)note.placeholder='포스트잇에 남길 제안을 적어줘';
  if(complete){
    complete.textContent='포스트잇 붙이기';
    complete.onclick=async()=>{
      const value=note?note.value.trim():'';
      if(!value)return alert('칠판에 남길 내용을 적어줘.');
      complete.disabled=true;
      try{await createBoardPost(value,mission.id);await completeMission(current,value);alert('무무클럽 칠판에 포스트잇을 붙였어!');secret()}
      catch(e){complete.disabled=false;alert('칠판에 올리지 못했어. 다시 시도해줘.')}
    };
  }
};