// Admin-only mission progress. Exact per-player counts stay out of the public home screen.
const adminProgressBaseGamePanel=adminGamePanel;
adminGamePanel=function(){
  return adminProgressBaseGamePanel()+`<section class="admin-panel admin-progress-panel"><h2>미션 진행 현황</h2><p class="small muted">각 캐릭터의 완료한 미션 수를 관리자만 확인할 수 있어.</p><div id="admin-mission-progress" class="admin-progress-list"><p class="small muted">불러오는 중...</p></div></section>`;
};
const adminProgressBaseBindGame=bindAdminGame;
bindAdminGame=function(){
  adminProgressBaseBindGame();
  refreshAdminMissionProgress();
};
async function refreshAdminMissionProgress(){
  const box=document.getElementById('admin-mission-progress');
  if(!box)return;
  try{
    const counts=await missionCounts();
    if(!document.getElementById('admin-mission-progress'))return;
    box.innerHTML=counts.map(({person:p,count})=>{
      const safe=Math.max(0,Math.min(25,Number(count)||0));
      const percent=(safe/25)*100;
      return `<div class="admin-progress-row"><div class="admin-progress-head">${adminCharacter(p)}<b>${safe}/25</b></div><div class="admin-progress-track" aria-label="${esc(p.name)} 미션 ${safe}/25"><span style="width:${percent}%"></span></div></div>`;
    }).join('');
  }catch(e){
    console.warn('admin mission progress',e);
    box.innerHTML='<p class="small muted">미션 진행 현황을 불러오지 못했어.</p>';
  }
}
(function installAdminProgressStyles(){
  if(document.getElementById('admin-progress-style'))return;
  const style=document.createElement('style');
  style.id='admin-progress-style';
  style.textContent='.admin-progress-panel{margin-top:14px}.admin-progress-list{display:grid;gap:12px;margin-top:14px}.admin-progress-row{padding:10px 11px;border-radius:12px;background:#f3eadf}.admin-progress-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.admin-progress-head>b{font-size:12px;white-space:nowrap}.admin-progress-track{height:7px;overflow:hidden;border-radius:999px;background:rgba(74,61,48,.12)}.admin-progress-track>span{display:block;height:100%;border-radius:inherit;background:var(--red);transition:width .2s ease}';
  document.head.appendChild(style);
})();
