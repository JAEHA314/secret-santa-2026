// Final UI hooks loaded last so they survive earlier function wrappers.
(function(){
  function mountCalendar(){
    if(!state.user||typeof loadMissions!=='function'||typeof calendarHtml!=='function')return;
    const main=document.querySelector('main.personal-page')||document.querySelector('main');
    if(!main||document.getElementById('mission-calendar-holder'))return;
    const profile=[...main.querySelectorAll('.card')].find(c=>c.querySelector('#logout'))||main.querySelector('.card');
    if(!profile)return;
    loadMissions().then(rows=>{
      if(document.getElementById('mission-calendar-holder'))return;
      const completed=rows.filter(x=>x.status==='completed'&&x.completed_at);
      const latest=completed.length?new Date(Math.max(...completed.map(x=>new Date(x.completed_at).getTime()))):new Date();
      let year=latest.getFullYear(),month=latest.getMonth();
      const holder=document.createElement('div');holder.id='mission-calendar-holder';
      profile.insertAdjacentElement('afterend',holder);
      const draw=()=>{
        holder.innerHTML=calendarHtml(rows,year,month);
        const prev=holder.querySelector('[data-cal-prev]'),next=holder.querySelector('[data-cal-next]');
        if(prev)prev.onclick=()=>{month--;if(month<0){month=11;year--}draw()};
        if(next)next.onclick=()=>{month++;if(month>11){month=0;year++}draw()};
        holder.querySelectorAll('[data-mission-date]').forEach(b=>b.onclick=()=>openMissionDay(b.dataset.missionDate,rows));
      };draw();
    }).catch(console.warn);
  }

  if(typeof me==='function'){
    const prevMe=me;
    me=async function(){await prevMe();setTimeout(mountCalendar,0)};
  }

  function addAdminTools(){
    const card=document.querySelector('.card.admin');
    if(!card||document.getElementById('admin-mailbox-open'))return;
    const reset=document.getElementById('reset');
    const box=document.createElement('div');box.className='admin-party-tools';
    box.innerHTML='<h3>파티 점검</h3><button id="admin-mailbox-open" class="secondary" type="button">우체통 확인</button><button id="admin-party-rehearsal" class="secondary" type="button">파티 당일 예행연습</button><p class="small muted">실제 게임 데이터는 바꾸지 않고 공개 화면을 미리 확인해.</p>';
    if(reset)reset.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
    document.getElementById('admin-mailbox-open').onclick=()=>adminMailbox();
    document.getElementById('admin-party-rehearsal').onclick=()=>adminPartyRehearsalPage();
  }

  if(typeof admin==='function'){
    const prevAdmin=admin;
    admin=function(){prevAdmin();setTimeout(addAdminTools,0)};
  }
})();