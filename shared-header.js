// Shared logged-in header: title + greeting/profile + secret inbox shortcut on every logged-in page.
const sharedHeaderBaseShell=shell;
const sharedHeaderNameColors={bear:'#6fa9c7',dog:'#d6a62a',frog:'#4f9a65',cat:'#77736f',rabbit:'#d9869d',glasses:'#9474ad'};
function sharedFaceSrc(id){return `assets/characters/${id}-face.png`}
shell=function(body,nav=true){const html=sharedHeaderBaseShell(body,nav);if(!state.user)return html;const u=person(state.user);if(!u)return html;const nameColor=sharedHeaderNameColors[state.user]||'inherit';const greeting=`<div class="shared-user-tools"><span class="shared-greeting"><small>안녕,</small><b style="color:${nameColor}">${esc(u.name)}!</b></span><button class="shared-profile-link shared-avatar" type="button" aria-label="내 프로필 열기"><img class="avatar-img" src="${sharedFaceSrc(state.user)}" alt="${esc(u.name)}"></button><button class="shared-inbox-link" type="button" aria-label="받은 익명 메시지 보기"><span aria-hidden="true">💌</span><b class="shared-inbox-count">0</b></button></div>`;return html.replace('<div class="brand">',`<div class="shared-header"><div class="brand">`).replace('</h1></div>',`</h1></div>${greeting}</div>`)};

// Inbox reader: newest first, mission context when present, and a scrollable chat area.
loadSecretMessages=async function(){const r=await fetch(`${SUPABASE_URL}/rest/v1/secret_messages?receiver_id=eq.${encodeURIComponent(state.user)}&select=id,message,mission_id,created_at,read_at&order=created_at.desc`,{headers:apiHeaders});if(!r.ok)throw new Error('message load');return r.json()};
function sharedInboxMissionTitle(id){if(id==null)return '';if(Number(id)===25)return '나의 위시리스트 작성하기';const m=MISSIONS.find(x=>Number(x.id)===Number(id));return m?m.title:''}
secretInboxHtml=function(messages){return `<section class="card secret-inbox-card"><div class="mission-head secret-inbox-head"><div><span class="mission-kicker">MY SECRET SANTA</span><h2>익명 메시지함</h2></div><b>${messages.length}</b></div><div class="secret-chat-scroll">${messages.length?messages.map(x=>{const mission=sharedInboxMissionTitle(x.mission_id);return `<article class="secret-chat-message">${mission?`<small class="secret-chat-mission">MISSION · ${esc(mission)}</small>`:''}<div class="secret-chat-bubble">${esc(x.message).replace(/\n/g,'<br>')}</div><time>${formatMessageDate(x.created_at)}</time></article>`}).join(''):'<p class="muted secret-chat-empty">아직 도착한 메시지가 없어.</p>'}</div></section>`};

async function refreshSharedInboxCount(){const badge=document.querySelector('.shared-inbox-count');if(!badge||typeof loadSecretMessages!=='function')return;try{const messages=await loadSecretMessages();if(document.body.contains(badge))badge.textContent=messages.length}catch(e){console.warn('shared inbox count',e)}}
function openSharedInbox(messages){const list=secretInboxHtml(messages);$('#app').innerHTML=shell(`<button id="shared-inbox-back" class="text-back" type="button">← 돌아가기</button>${list}`,false);const main=document.querySelector('#app main');if(main)main.classList.add('secret-inbox-page');bindNav();const back=$('#shared-inbox-back');if(back)back.onclick=()=>render('home')}
async function showSharedInbox(){let messages=[];try{messages=await loadSecretMessages()}catch(e){console.warn(e)}openSharedInbox(messages)}

// Profile touch/click is handled once, authoritatively, by navigation.js.
// Do not attach per-render pointer/touch listeners here: they compete with delegated
// navigation and were the source of intermittent multi-tap behaviour on iOS.
const sharedHeaderBaseBindNav=bindNav;
bindNav=function(){sharedHeaderBaseBindNav();document.querySelectorAll('.shared-inbox-link').forEach(button=>{button.onclick=showSharedInbox});refreshSharedInboxCount()};
const sharedHeaderBaseMe=me;
me=async function(){await sharedHeaderBaseMe();const main=document.querySelector('main');if(!main)return;main.classList.add('personal-page');if(!main.querySelector('#personal-home-back')){const back=document.createElement('button');back.id='personal-home-back';back.className='text-back personal-home-back';back.type='button';back.textContent='‹ HOME으로';back.onclick=()=>render('home');const header=main.querySelector('.shared-header');if(header)header.insertAdjacentElement('afterend',back);else main.prepend(back)}};
