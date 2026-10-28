// Admin mission filters and sealed-mailbox inspection.
let adminMissionTargetFilter='all';
let adminMissionTypeFilter='all';

const adminBaseGamePanel=adminGamePanel;
adminGamePanel=function(){
  return adminBaseGamePanel().replace('</section>',`<div class="admin-mailbox-tools"><h3>우체통 편지</h3><p class="small muted">파티 전에도 모든 편지를 확인할 수 있어. 익명 편지도 관리자에게는 실제 작성자가 표시돼.</p><button id="admin-show-mailbox" class="secondary" type="button">우체통 편지 확인</button><div id="admin-mailbox-letters" class="admin-mailbox-list hidden"></div></div></section>`);
};

const adminBaseBindGame=bindAdminGame;
bindAdminGame=function(){
  adminBaseBindGame();
  const button=document.querySelector('#admin-show-mailbox');
  const list=document.querySelector('#admin-mailbox-letters');
  if(!button||!list)return;
  button.onclick=async()=>{
    if(!list.classList.contains('hidden')){list.classList.add('hidden');list.innerHTML='';button.textContent='우체통 편지 확인';return}
    button.disabled=true;
    try{
      const rows=await loadAllMailboxLetters();
      list.innerHTML=rows.length?rows.slice().reverse().map(x=>{
        const free=typeof freeMailboxMeta==='function'?freeMailboxMeta(x):null;
        const sender=person(x.sender_id);
        const audience=typeof partyMailboxAudience==='function'?partyMailboxAudience(x):(x.receiver_id||'');
        const receiver=audience==='everyone'?null:person(audience);
        const to=audience==='everyone'?'모두':(receiver?.name||'알 수 없음');
        const body=free?free.message:(x.message||'');
        const anon=x.is_anonymous?'<span class="admin-anon-badge">사용자 화면 익명</span>':'';
        return `<article class="admin-mailbox-letter"><div class="admin-mailbox-meta"><b>FROM. ${sender?esc(sender.name):'알 수 없음'}</b><span>TO. ${esc(to)}</span>${anon}</div><p>${esc(body).replace(/\n/g,'<br>')}</p><small>${formatMessageDate(x.created_at)}</small></article>`;
      }).join(''):'<p class="small muted">아직 우체통에 들어온 편지가 없어.</p>';
      list.classList.remove('hidden');
      button.textContent='우체통 편지 닫기';
    }catch(e){console.error(e);alert('우체통 편지를 불러오지 못했어.')}
    finally{button.disabled=false}
  };
};

adminMissionPanel=function(){
  const defs=[...missionDefinitions.values()].sort((a,b)=>a.id-b.id);
  const targets=['마니또','모두','나'];
  const types=[['mailbox','우체통'],['message','메시지'],['board','자유게시판'],['action','행동형']];
  const filtered=defs.filter(d=>(adminMissionTargetFilter==='all'||d.target===adminMissionTargetFilter)&&(adminMissionTypeFilter==='all'||d.type===adminMissionTypeFilter));
  return `<section class="admin-panel"><h2>미션 관리</h2><p class="small muted">대상과 유형은 내부 동작을 위한 관리자 설정이야. 사용자에게는 미션 내용, 기록 문구, 추가 안내만 보여.</p><div class="admin-mission-filters"><label>대상<select id="admin-mission-target-filter"><option value="all">전체 대상</option>${targets.map(x=>`<option value="${x}" ${adminMissionTargetFilter===x?'selected':''}>${x}</option>`).join('')}</select></label><label>유형<select id="admin-mission-type-filter"><option value="all">전체 유형</option>${types.map(([v,n])=>`<option value="${v}" ${adminMissionTypeFilter===v?'selected':''}>${n}</option>`).join('')}</select></label></div><p class="admin-filter-count small muted">${filtered.length}개 미션</p>${filtered.length?filtered.map(missionAdminCard).join(''):'<p class="admin-empty-filter">조건에 맞는 미션이 없어.</p>'}</section>`;
};

const adminBaseBindMissions=bindAdminMissions;
bindAdminMissions=function(){
  adminBaseBindMissions();
  const target=document.querySelector('#admin-mission-target-filter');
  const type=document.querySelector('#admin-mission-type-filter');
  if(target)target.onchange=()=>{adminMissionTargetFilter=target.value;admin()};
  if(type)type.onchange=()=>{adminMissionTypeFilter=type.value;admin()};
};
