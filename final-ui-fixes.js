// Reliable final DOM mounts for calendar + admin party tools.
(function(){
  let calendarBusy=false;

  async function mountCalendar(){
    if(calendarBusy||!state.user||typeof loadMissions!=='function'||typeof calendarHtml!=='function')return;
    const logout=document.getElementById('logout');
    if(!logout)return;
    const main=logout.closest('main');
    if(!main)return;
    const old=document.getElementById('mission-calendar-holder');
    if(old&&old.dataset.ready==='1')return;
    calendarBusy=true;
    try{
      const rows=await loadMissions(state.user);
      let holder=old;
      if(!holder){
        holder=document.createElement('div');
        holder.id='mission-calendar-holder';
        const profile=logout.closest('.card');
        if(profile)profile.insertAdjacentElement('afterend',holder);else main.prepend(holder);
      }
      const completed=rows.filter(x=>x.status==='completed'&&x.completed_at);
      const latest=completed.length?new Date(Math.max(...completed.map(x=>new Date(x.completed_at).getTime()))):new Date();
      let year=latest.getFullYear(),month=latest.getMonth();
      const draw=()=>{
        holder.innerHTML=calendarHtml(rows,year,month);
        holder.dataset.ready='1';
        const prev=holder.querySelector('[data-cal-prev]');
        const next=holder.querySelector('[data-cal-next]');
        if(prev)prev.onclick=()=>{month--;if(month<0){month=11;year--}draw()};
        if(next)next.onclick=()=>{month++;if(month>11){month=0;year++}draw()};
        holder.querySelectorAll('[data-mission-date]').forEach(b=>b.onclick=()=>openMissionDay(b.dataset.missionDate,rows));
      };
      draw();
    }catch(e){console.error('calendar mount failed',e)}finally{calendarBusy=false}
  }

  function mountAdminTools(){
    const card=document.querySelector('.card.admin');
    if(!card||document.getElementById('admin-mailbox-open'))return;
    if(typeof adminMailbox!=='function'||typeof adminPartyRehearsalPage!=='function')return;
    const box=document.createElement('div');
    box.className='admin-party-tools';
    box.innerHTML='<h3>파티 점검</h3><button id="admin-mailbox-open" class="secondary" type="button">우체통 확인</button><button id="admin-party-rehearsal" class="secondary" type="button">파티 당일 예행연습</button><p class="small muted">실제 게임 데이터는 바꾸지 않고 공개 상태만 미리 확인해.</p>';
    const reset=document.getElementById('reset');
    if(reset)reset.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
    document.getElementById('admin-mailbox-open').addEventListener('click',adminMailbox);
    document.getElementById('admin-party-rehearsal').addEventListener('click',adminPartyRehearsalPage);
  }

  function sync(){mountCalendar();mountAdminTools()}
  const app=document.getElementById('app');
  if(app){new MutationObserver(sync).observe(app,{childList:true,subtree:true});}
  sync();
})();