// Personal mission completion calendar. Uses player_missions.completed_at already stored in Supabase.
function calendarMissionInfo(id){
  if(Number(id)===25)return {title:'나의 위시리스트 작성하기',type:'wish'};
  return MISSIONS.find(m=>Number(m.id)===Number(id))||{title:'미션',type:'memo'};
}

function calendarDateKey(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function calendarMonthTitle(year,month){return `${year}년 ${month+1}월`}

function calendarHtml(rows,year,month){
  const done=rows.filter(x=>x.status==='completed'&&x.completed_at);
  const byDate={};
  done.forEach(row=>{const key=calendarDateKey(row.completed_at);if(key)(byDate[key]||(byDate[key]=[])).push(row)});
  const first=new Date(year,month,1).getDay();
  const last=new Date(year,month+1,0).getDate();
  let cells='';
  for(let i=0;i<first;i++)cells+='<span class="mission-cal-day empty"></span>';
  for(let day=1;day<=last;day++){
    const key=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const count=(byDate[key]||[]).length;
    cells+=`<button class="mission-cal-day${count?' has-mission':''}" type="button" data-mission-date="${key}"><span>${day}</span>${count?`<i>${count>1?count:''}</i>`:''}</button>`;
  }
  return `<section class="card mission-calendar-card"><div class="mission-calendar-head"><div><span class="mission-kicker">MY MISSION</span><h2>나의 미션 기록</h2></div><div class="mission-calendar-nav"><button type="button" data-cal-prev aria-label="이전 달">‹</button><b>${calendarMonthTitle(year,month)}</b><button type="button" data-cal-next aria-label="다음 달">›</button></div></div><div class="mission-cal-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="mission-cal-grid">${cells}</div><p class="mission-cal-guide">● 미션을 완료한 날 · 날짜를 눌러 기록을 확인해봐.</p></section>`;
}

function openMissionDay(key,rows){
  const items=rows.filter(x=>x.status==='completed'&&calendarDateKey(x.completed_at)===key);
  if(!items.length)return;
  const [,m,d]=key.split('-');
  const modal=document.createElement('div');
  modal.className='mission-day-modal';
  modal.innerHTML=`<div class="mission-day-backdrop" data-mission-day-close></div><section class="mission-day-sheet"><button class="mission-day-close" type="button" data-mission-day-close>×</button><span class="mission-kicker">MISSION DIARY</span><h2>${Number(m)}월 ${Number(d)}일</h2><div class="mission-day-list">${items.map(row=>{const mission=calendarMissionInfo(row.mission_id);const note=(row.note||'').trim();return `<article><b>${esc(mission.title)}</b>${note?`<p>${esc(note).replace(/\n/g,'<br>')}</p>`:'<p class="muted">완료한 미션</p>'}</article>`}).join('')}</div></section>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-mission-day-close]').forEach(x=>x.onclick=()=>modal.remove());
}

const missionCalendarBaseMe=me;
me=async function(){
  await missionCalendarBaseMe();
  let rows=[];
  try{rows=await loadMissions(state.user)}catch(e){console.warn('mission calendar load',e)}
  const completed=rows.filter(x=>x.status==='completed'&&x.completed_at);
  const latest=completed.length?new Date(Math.max(...completed.map(x=>new Date(x.completed_at).getTime()))):new Date();
  let year=latest.getFullYear(),month=latest.getMonth();

  // Insert directly after the profile card. Do not depend on wrapper classes,
  // because the personal page is assembled by several feature overrides.
  const main=document.querySelector('#app main');
  const profile=main&&main.querySelector(':scope > section.card');
  if(!main||!profile)return;
  const old=document.querySelector('#mission-calendar-holder');
  if(old)old.remove();
  const holder=document.createElement('div');
  holder.id='mission-calendar-holder';
  profile.insertAdjacentElement('afterend',holder);

  const renderCalendar=()=>{
    holder.innerHTML=calendarHtml(rows,year,month);
    holder.querySelector('[data-cal-prev]').onclick=()=>{month--;if(month<0){month=11;year--}renderCalendar()};
    holder.querySelector('[data-cal-next]').onclick=()=>{month++;if(month>11){month=0;year++}renderCalendar()};
    holder.querySelectorAll('[data-mission-date]').forEach(button=>button.onclick=()=>openMissionDay(button.dataset.missionDate,rows));
  };
  renderCalendar();
};