// Last-resort UI mounts. Calendar renders immediately, then hydrates mission data.
(function(){
  let calendarBusy=false;

  function wireCalendar(holder,rows,year,month){
    const draw=()=>{
      holder.innerHTML=calendarHtml(rows,year,month);
      const prev=holder.querySelector('[data-cal-prev]');
      const next=holder.querySelector('[data-cal-next]');
      if(prev)prev.onclick=()=>{month--;if(month<0){month=11;year--}draw()};
      if(next)next.onclick=()=>{month++;if(month>11){month=0;year++}draw()};
      holder.querySelectorAll('[data-mission-date]').forEach(b=>b.onclick=()=>openMissionDay(b.dataset.missionDate,rows));
    };
    draw();
  }

  async function mountCalendar(){
    if(calendarBusy||!state.user||typeof calendarHtml!=='function')return;
    const logout=document.getElementById('logout');
    if(!logout)return;
    const main=logout.closest('main');
    const profile=logout.closest('.card');
    if(!main||!profile)return;
    let holder=document.getElementById('mission-calendar-holder');
    if(holder)return;

    holder=document.createElement('div');
    holder.id='mission-calendar-holder';
    profile.insertAdjacentElement('afterend',holder);
    const now=new Date();
    wireCalendar(holder,[],now.getFullYear(),now.getMonth());

    if(typeof loadMissions!=='function')return;
    calendarBusy=true;
    try{
      const rows=await loadMissions(state.user);
      const completed=rows.filter(x=>x.status==='completed'&&x.completed_at);
      const latest=completed.length?new Date(Math.max(...completed.map(x=>new Date(x.completed_at).getTime()))):now;
      wireCalendar(holder,rows,latest.getFullYear(),latest.getMonth());
    }catch(e){console.error('calendar data load failed',e)}finally{calendarBusy=false}
  }

  function mountAdminTools(){
    const card=document.querySelector('.card.admin');
    if(!card||document.getElementById('admin-mailbox-open'))return;
    if(typeof adminMailbox!=='function'||typeof adminPartyRehearsalPage!=='function')return;
    const box=document.createElement('div');
    box.className='admin-party-tools';
    box.innerHTML='<h3>파티 점검</h3><button id="admin-mailbox-open" class="secondary" type="button">우체통 확인</button><button id="admin-party-rehearsal" class="secondary" type="button">파티 당일 예행연습</button><p class="small muted">실제 게임 데이터는 변경하지 않아.</p>';
    const reset=document.getElementById('reset');
    if(reset)reset.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
    document.getElementById('admin-mailbox-open').onclick=adminMailbox;
    document.getElementById('admin-party-rehearsal').onclick=adminPartyRehearsalPage;
  }

  function sync(){mountCalendar();mountAdminTools()}
  const app=document.getElementById('app');
  if(app)new MutationObserver(sync).observe(app,{childList:true,subtree:true});
  sync();
})();