const PAGE_HELP={
  home:{kicker:'HOW TO',title:'홈 화면 안내',items:[['🎄','트리 꾸미기','미션을 완료할 때마다 트리에 장식이 하나씩 추가돼. 모두 함께 트리를 완성해봐!'],['TREE Lv.','트리 레벨','현재까지 모은 장식 개수와 트리의 완성도를 확인할 수 있어.'],['D-day','파티까지 남은 날짜','마니또가 공개되는 연말 파티까지 남은 날짜야.'],['👥','친구들의 진행도','트리 아래에서 친구들이 완료한 미션 개수를 확인할 수 있어.']]},
  mail:{kicker:'HOW TO',title:'우체통 안내',items:[['📮','무무클럽 우체통','파티 전까지 편지를 모아두는 곳이야. 공개 뒤 다 같이 열어볼 수 있어.'],['✉️','편지 쓰기','마니또에게 익명 메시지를 보내거나, 우체통에 넣을 편지를 쓸 수 있어.'],['TO.','수신자 선택','우체통 편지는 모두에게 보내거나 원하는 친구 한 명을 골라 보낼 수 있어.']]},
  secret:{kicker:'HOW TO',title:'시크릿 미션 안내',items:[['🎅','나의 마니또','내가 몰래 챙길 사람과 오늘 수행할 미션을 확인하는 곳이야.'],['✓','미션 수행','미션의 안내에 따라 메시지·편지·게시글 등을 남기면 완료할 수 있어.'],['25','진행도','완료한 미션 수를 확인하고 차근차근 25개를 채워봐.']]},
  wish:{kicker:'HOW TO',title:'위시리스트 안내',items:[['♡','친구들의 위시리스트','각 캐릭터를 눌러 좋아하는 것과 싫어하는 것을 확인할 수 있어.'],['🎁','선물 힌트','마니또 선물을 고를 때 참고할 수 있는 힌트야.'],['나','내 위시리스트','내 캐릭터에서는 내 취향을 직접 작성하고 수정할 수 있어.']]},
  me:{kicker:'HOW TO',title:'내 기록 안내',items:[['☺','프로필','내 캐릭터와 지금 설정한 상태 메시지를 확인할 수 있어.'],['📅','나의 미션 기록','달력에서 내가 미션을 완료한 날짜와 기록을 확인할 수 있어.']]},
  inbox:{kicker:'HOW TO',title:'익명 메시지함 안내',items:[['💌','익명 메시지','내 마니또가 미션으로 보낸 익명 메시지가 이곳에 모여.'],['🔒','정체는 비밀','파티에서 마니또가 공개되기 전까지 보낸 사람의 정체는 비밀이야.']]},
  board:{kicker:'HOW TO',title:'자유게시판 안내',items:[['📌','자유게시판','무무클럽 친구들이 함께 글을 남기고 보는 공간이야.'],['⌄','필터','작성자와 글 종류를 골라 원하는 게시글만 모아볼 수 있어.']]}
};
function helpPageKey(){
  const text=($('#app')?.innerText||'');
  if(text.includes('자유게시판'))return 'board';
  if(text.includes('익명 메시지함'))return 'inbox';
  if(text.includes('나의 미션 기록'))return 'me';
  if(text.includes('우리의 위시리스트')||text.includes('위시리스트'))return 'wish';
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
  const target=key==='home'?(document.querySelector('.tree-scene,.tree-wrap,.tree-card')||document.querySelector('.shell')):(document.querySelector('.card')||document.querySelector('.shell'));
  if(!target)return;
  const b=document.createElement('button');b.type='button';b.className='page-help-trigger';b.textContent='ⓘ';b.setAttribute('aria-label','이 페이지 설명 보기');b.onclick=e=>{e.stopPropagation();openPageHelp(key)};
  target.appendChild(b);
}
const pageHelpObserver=new MutationObserver(()=>{clearTimeout(window.__pageHelpTimer);window.__pageHelpTimer=setTimeout(installPageHelp,20)});
window.addEventListener('DOMContentLoaded',()=>{pageHelpObserver.observe(document.getElementById('app'),{childList:true,subtree:true});installPageHelp()});