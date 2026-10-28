const PAGE_HELP={
  home:{kicker:'HOW TO',title:'TRIM THE TREE',items:[['🎄','미션으로 트리 꾸미기','미션을 완료할수록 트리에 장식이 하나씩 늘어나.<br>모두 함께 트리를 완성해보자!'],['👑','미션 진행도 확인하기','친구들이 지금까지 완료한 미션 수를 확인할 수 있어.<br>가장 많은 미션을 수행한 친구에게는 왕관이 씌워져.'],['☺️','이거 내 이모지야','각 캐릭터의 얼굴을 눌러봐!<br>친구들이 설정한 상태 이모지를 확인할 수 있어.']]},
  mail:{kicker:'HOW TO',title:'WRITE A LETTER',items:[['📮','무무클럽 우체통','파티 전까지 편지를 모아두는 곳이야.<br>마니또가 모두 공개될 때까지 우체통은 열어볼 수 없어!'],['💚','마니또에게 익명으로 보내기','내 마니또에게 익명 메시지를 보낼 수 있어.<br>편지를 받은 사람은 익명 메시지함에서 확인할 수 있어.'],['❤️','수신자를 선택하고 우체통에 넣기','수신자를 선택해서 편지를 보낼 수 있어!<br>우체통이 열리면 다같이 확인할 수 있어.']]},
  secret:{kicker:'HOW TO',title:'SECRET SANTA',items:[['🎅','나의 마니또','마니또를 뽑으면, 내가 몰래 챙겨야 할 친구가 정해져.<br>파티 날까지 정체는 비밀!'],['🎯','오늘의 미션','파티 전까지 수행해야 할 미션이 하나씩 주어져.<br>미션을 수행해서 트리를 꾸며보자!'],['↻','미션 패스','지금 하기 어려운 미션은 패스하고 다음에 다시 도전할 수 있어.<br>하지만 트리를 완성하기 위해서는 패스한 미션도 언젠가 해야 해!']]},
  me:{kicker:'HOW TO',title:'프로필',items:[['☺️','이거 내 이모지야','내 캐릭터의 상태 이모지를 자유롭게 설정하고 바꿀 수 있어.<br>홈 화면의 트리 아래 캐릭터 얼굴을 누르면 다른 친구의 이모지를 확인할 수 있어.'],['📅','나의 미션 기록','달력에서 미션을 완료한 날을 확인할 수 있어.<br>날짜를 눌러 그날 어떤 미션을 했는지도 다시 볼 수 있어.']]},
  inbox:{kicker:'HOW TO',title:'익명 메시지함',items:[['💌','마니또의 메시지','내 마니또가 보낸 익명 메시지가 이곳에 차곡차곡 모여.'],['🔒','파티 전까지 비밀','누가 내 마니또인지는 파티 날까지 비밀이야.<br>메시지를 보면서 누군지 추측해봐!']]},
  board:{kicker:'HOW TO',title:'자유게시판',items:[['📌','자유게시판','무무클럽 친구들이 자유롭게 이야기를 남기는 공간이야.<br>미션이 아니어도 언제든 하고 싶은 이야기를 자유롭게 남길 수 있어.'],['✅','골라보기','작성자와 글 종류를 선택해서 보고 싶은 게시물만 모아볼 수 있어.']]}
};
function helpPageKey(){
  const text=($('#app')?.innerText||'');
  if(text.includes('자유게시판'))return 'board';
  if(text.includes('익명 메시지함'))return 'inbox';
  if(text.includes('나의 미션 기록'))return 'me';
  if(text.includes('우리의 위시리스트')||text.includes('위시리스트'))return null;
  if(text.includes('무무클럽 우체통')||text.includes('편지 쓰기'))return 'mail';
  if(text.includes('내가 챙길 사람은')||text.includes("TODAY'S MISSION")||text.includes('FIRST MISSION'))return 'secret';
  if(document.querySelector('.tree-scene,.tree-wrap,.tree-card'))return 'home';
  return null;
}
function helpHtml(data){return `<div class="page-help-backdrop"><section class="page-help-modal"><button class="page-help-close" type="button" aria-label="닫기">×</button><div class="page-help-kicker">${data.kicker}</div><h2>${data.title}</h2><div class="page-help-items">${data.items.map(([icon,title,body])=>`<div class="page-help-item"><div class="page-help-icon">${icon}</div><div><b>${title}</b><p>${body}</p></div></div>`).join('')}</div><button class="page-help-ok" type="button">확인했어요!</button></section></div>`}
function openPageHelp(key){const data=PAGE_HELP[key];if(!data)return;document.body.insertAdjacentHTML('beforeend',helpHtml(data));const close=()=>document.querySelector('.page-help-backdrop')?.remove();document.querySelector('.page-help-close').onclick=close;document.querySelector('.page-help-ok').onclick=close;document.querySelector('.page-help-backdrop').onclick=e=>{if(e.target.classList.contains('page-help-backdrop'))close()}}
function installPageHelp(){
  document.querySelectorAll('.page-help-trigger').forEach(x=>x.remove());
  const key=helpPageKey();if(!key)return;
  let target;
  if(key==='home')target=document.querySelector('.tree-scene,.tree-wrap,.tree-card')||document.querySelector('.shell');
  else if(key==='board')target=document.querySelector('.board-shell,.board-frame,.board-panel,.board')||document.querySelector('.card')||document.querySelector('.shell');
  else target=document.querySelector('.card')||document.querySelector('.shell');
  if(!target)return;
  const b=document.createElement('button');b.type='button';b.className='page-help-trigger';b.textContent='ⓘ';b.setAttribute('aria-label','이 페이지 설명 보기');b.onclick=e=>{e.stopPropagation();openPageHelp(key)};
  target.appendChild(b);
}
const pageHelpObserver=new MutationObserver(()=>{clearTimeout(window.__pageHelpTimer);window.__pageHelpTimer=setTimeout(installPageHelp,20)});
window.addEventListener('DOMContentLoaded',()=>{pageHelpObserver.observe(document.getElementById('app'),{childList:true,subtree:true});installPageHelp()});