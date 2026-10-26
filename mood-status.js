// Shared emoji status. Uses a dedicated Supabase player_moods table.
async function loadMoodStatuses(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_moods?select=player_id,emoji,updated_at`,{headers:apiHeaders});
  if(!r.ok)throw new Error('mood load');
  const rows=await r.json(),map={};
  rows.forEach(x=>{map[x.player_id]={emoji:String(x.emoji||'').trim()}});
  return map;
}
async function saveMyMood(emoji){
  const clean=String(emoji||'').trim().slice(0,16);
  if(!clean){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/player_moods?player_id=eq.${encodeURIComponent(state.user)}`,{method:'DELETE',headers:apiHeaders});
    if(!r.ok)throw new Error('mood delete');
    return '';
  }
  const r=await fetch(`${SUPABASE_URL}/rest/v1/player_moods?on_conflict=player_id`,{method:'POST',headers:{...apiHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({player_id:state.user,emoji:clean,updated_at:new Date().toISOString()})});
  if(!r.ok)throw new Error('mood save');
  return clean;
}
function openMoodEditor(current=''){
  const modal=document.createElement('div');modal.className='mood-popover';
  modal.innerHTML=`<section class="mood-dialog"><h3>내 말풍선</h3><p>이모티콘을 넣어두면 HOME에서 친구들이 내 얼굴을 눌러 볼 수 있어.</p><input class="mood-input" id="mood-input" value="${esc(current)}" maxlength="16" inputmode="text" placeholder="🎄"><div class="mood-actions"><button class="secondary" id="mood-cancel" type="button">취소</button><button class="primary" id="mood-save" type="button">저장</button></div></section>`;
  document.body.appendChild(modal);const input=modal.querySelector('#mood-input');setTimeout(()=>input.focus(),50);
  modal.querySelector('#mood-cancel').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
  modal.querySelector('#mood-save').onclick=async()=>{const b=modal.querySelector('#mood-save');b.disabled=true;try{await saveMyMood(input.value);modal.remove();await render('me')}catch(e){b.disabled=false;alert('말풍선을 저장하지 못했어. player_moods 테이블 설정을 확인해줘.')}};
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
