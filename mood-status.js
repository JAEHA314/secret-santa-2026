// Shared emoji status. Stored as hidden free-note records so no new database table is required.
const MOOD_STATUS_PREFIX='[[MOOD]]';
function moodValue(content){return String(content||'').startsWith(MOOD_STATUS_PREFIX)?String(content).slice(MOOD_STATUS_PREFIX.length).trim():''}
async function loadMoodStatuses(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/board_posts?mission_id=is.null&content=like.${encodeURIComponent(MOOD_STATUS_PREFIX+'*')}&select=id,player_id,content,created_at&order=created_at.desc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('mood load');
  const rows=await r.json(),map={};
  rows.forEach(x=>{if(!(x.player_id in map))map[x.player_id]={id:x.id,emoji:moodValue(x.content)}});
  return map;
}
async function saveMyMood(emoji){
  const clean=String(emoji||'').trim().slice(0,16);
  const existing=await fetch(`${SUPABASE_URL}/rest/v1/board_posts?player_id=eq.${encodeURIComponent(state.user)}&mission_id=is.null&content=like.${encodeURIComponent(MOOD_STATUS_PREFIX+'*')}&select=id`,{headers:apiHeaders});
  if(!existing.ok)throw new Error('mood lookup');
  const rows=await existing.json();
  for(const row of rows){const d=await fetch(`${SUPABASE_URL}/rest/v1/board_posts?id=eq.${encodeURIComponent(row.id)}&player_id=eq.${encodeURIComponent(state.user)}`,{method:'DELETE',headers:apiHeaders});if(!d.ok)throw new Error('mood delete')}
  if(clean){const r=await fetch(`${SUPABASE_URL}/rest/v1/board_posts`,{method:'POST',headers:apiHeaders,body:JSON.stringify({player_id:state.user,mission_id:null,content:MOOD_STATUS_PREFIX+clean})});if(!r.ok)throw new Error('mood save')}
  return clean;
}
function openMoodEditor(current=''){
  const modal=document.createElement('div');modal.className='mood-popover';
  modal.innerHTML=`<section class="mood-dialog"><h3>내 말풍선</h3><p>이모티콘을 넣어두면 HOME에서 친구들이 내 얼굴을 눌러 볼 수 있어.</p><input class="mood-input" id="mood-input" value="${esc(current)}" maxlength="16" inputmode="text" placeholder="🎄"><div class="mood-actions"><button class="secondary" id="mood-cancel" type="button">취소</button><button class="primary" id="mood-save" type="button">저장</button></div></section>`;
  document.body.appendChild(modal);const input=modal.querySelector('#mood-input');setTimeout(()=>input.focus(),50);
  modal.querySelector('#mood-cancel').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
  modal.querySelector('#mood-save').onclick=async()=>{const b=modal.querySelector('#mood-save');b.disabled=true;try{await saveMyMood(input.value);modal.remove();await render('me')}catch(e){b.disabled=false;alert('말풍선을 저장하지 못했어. 다시 시도해줘.')}};
}
function mountMoodEditor(){
  const profile=document.querySelector('.personal-page > .card:first-of-type');if(!profile)return;
  loadMoodStatuses().then(map=>{if(!document.body.contains(profile))return;const current=map[state.user]?.emoji||'';const box=document.createElement('div');box.className='mood-editor';box.innerHTML=`<button class="mood-bubble" type="button" aria-label="내 말풍선 수정">${esc(current||'＋')}</button><button class="mood-edit-button" type="button">말풍선 수정</button>`;profile.appendChild(box);box.querySelectorAll('button').forEach(b=>b.onclick=()=>openMoodEditor(current))}).catch(e=>console.warn('mood editor',e));
}
function bindTreeMoodBubbles(){
  const racers=[...document.querySelectorAll('.tree-racer')];if(!racers.length)return;
  loadMoodStatuses().then(map=>racers.forEach((el,index)=>{const p=PEOPLE[index];if(!p)return;el.setAttribute('role','button');el.setAttribute('tabindex','0');const show=()=>{document.querySelectorAll('.tree-mood-popup').forEach(x=>x.remove());const emoji=map[p.id]?.emoji;if(!emoji)return;const bubble=document.createElement('span');bubble.className='tree-mood-popup';bubble.textContent=emoji;el.appendChild(bubble);clearTimeout(el._moodTimer);el._moodTimer=setTimeout(()=>bubble.remove(),3000)};el.onclick=show;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}}})).catch(e=>console.warn('tree moods',e));
}
const moodBaseMe=me;me=async function(){await moodBaseMe();mountMoodEditor()};
const moodBaseHome=home;home=async function(){await moodBaseHome();bindTreeMoodBubbles()};
