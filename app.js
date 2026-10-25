const PEOPLE=[
{id:'bear',name:'북극곰',face:'🐻‍❄️'},
{id:'dog',name:'강아지',face:'🐶'},
{id:'frog',name:'개구리',face:'🐸'},
{id:'cat',name:'고양이',face:'🐱'},
{id:'rabbit',name:'토끼',face:'🐰'},
{id:'glasses',name:'안경이',face:'🤓'}];
const KEY='ss26-state';
const defaultState={user:null,pins:{},dDay:'2026-12-31',giftLimit:30000,assignments:null,drawnBy:{},progress:0,ornaments:0};
let state=Object.assign({},defaultState,JSON.parse(localStorage.getItem(KEY)||'{}'));
if(!state.drawnBy)state.drawnBy={};
let selected=null;
let adminSequence=[];
const ADMIN_PATTERN=['cat','cat','cat','cat','cat','dog'];
const $=s=>document.querySelector(s);
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function person(id){return PEOPLE.find(p=>p.id===id)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function days(){let a=new Date();a.setHours(0,0,0,0);let b=new Date(state.dDay+'T00:00:00');return Math.ceil((b-a)/86400000)}
function shell(body,nav=true){return `<main class="shell"><div class="brand"><div class="star">✦</div><h1>Secret Santa</h1><p>우리 여섯의 작은 연말</p></div>${body}</main>${nav?`<nav class="nav"><button data-go="home"><b>⌂</b>HOME</button><button data-go="secret"><b>✦</b>SECRET</button><button data-go="me"><b>♡</b>ME</button></nav>`:''}`}
function bindNav(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>render(b.dataset.go))}
function render(page='home'){if(!state.user)return login();if(page==='secret')return secret();if(page==='me')return me();home()}
function handleAdminTap(id){
  adminSequence.push(id);
  if(adminSequence.length>ADMIN_PATTERN.length)adminSequence.shift();
  const prefix=ADMIN_PATTERN.slice(0,adminSequence.length);
  if(!adminSequence.every((v,i)=>v===prefix[i])){
    adminSequence=id==='cat'?['cat']:[];
  }
  if(adminSequence.length===ADMIN_PATTERN.length&&adminSequence.every((v,i)=>v===ADMIN_PATTERN[i])){
    adminSequence=[];
    adminLogin();
  }
}
function login(){
  let cards=PEOPLE.map(p=>`<button class="character" data-id="${p.id}"><span class="face">${p.face}</span><b>${p.name}</b></button>`).join('');
  $('#app').innerHTML=shell(`<section class="card"><h2>나는 누구야?</h2><p class="muted">내 캐릭터를 골라줘.</p><div class="characters">${cards}</div><div id="pinbox" class="hidden"><input id="pin" class="field" inputmode="numeric" maxlength="4" placeholder="4자리 PIN"><button id="login" class="primary">들어가기</button><p class="small muted">처음 들어오면 입력한 번호가 내 PIN으로 저장돼.</p></div></section>`,false);
  document.querySelectorAll('.character').forEach(b=>b.onclick=()=>{
    const id=b.dataset.id;
    handleAdminTap(id);
    selected=id;
    document.querySelectorAll('.character').forEach(x=>x.classList.toggle('selected',x===b));
    $('#pinbox').classList.remove('hidden');
  });
  $('#login').onclick=()=>{let pin=$('#pin').value.trim();if(!selected||!/^[0-9]{4}$/.test(pin))return alert('4자리 숫자 PIN을 입력해줘.');if(state.pins[selected]&&state.pins[selected]!==pin)return alert('PIN이 달라!');if(!state.pins[selected])state.pins[selected]=pin;state.user=selected;adminSequence=[];save();render()}
}
function home(){let u=person(state.user),d=days();$('#app').innerHTML=shell(`<div class="top"><div><small>안녕,</small><h2>${u.name}!</h2></div><div class="avatar">${u.face}</div></div><section class="card hero"><div class="tree">🎄</div><h2>${d>=0?'D-'+d:'PARTY DAY!'}</h2><p class="muted">모두의 미션으로 트리를 완성해요.</p><div class="progress"><div style="width:${state.progress}%"></div></div><b>${state.progress}% · 장식 ${state.ornaments}개</b></section><div class="stats"><div class="stat">연말 파티<strong>${esc(state.dDay)}</strong></div><div class="stat">선물 상한<strong>${Number(state.giftLimit).toLocaleString()}원</strong></div></div><section class="card"><h3>오늘의 한 조각</h3><p>아직 미션 기능은 준비 중이야. 다음 버전에서 익명 메시지와 함께 연결할게.</p></section>`);bindNav()}
function derange(){let ids=PEOPLE.map(p=>p.id),to;do{to=[...ids];for(let i=to.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[to[i],to[j]]=[to[j],to[i]]}}while(ids.some((x,i)=>x===to[i]));return Object.fromEntries(ids.map((x,i)=>[x,to[i]]))}
function secret(){
  const hasDrawn=!!state.drawnBy[state.user];
  let body;
  if(!hasDrawn){
    body=`<section class="card"><h2>내 마니또를 뽑아볼까?</h2><p class="muted">버튼을 누르면 이미 정해진 여섯 명의 마니또 관계 중 내 결과만 공개돼.</p><div class="reveal">🎁</div><button id="draw" class="primary">마니또 뽑기</button></section>`;
  }else{
    let t=person(state.assignments[state.user]);
    body=`<section class="card"><h2>내가 챙길 사람은…</h2><div class="reveal">${t.face}</div><h2 style="text-align:center">${t.name}</h2><p class="muted" style="text-align:center">쉿. 누가 나를 뽑았는지는 파티 날까지 비밀!</p></section>`;
  }
  $('#app').innerHTML=shell(body);bindNav();
  if($('#draw'))$('#draw').onclick=()=>{
    if(!confirm('두근두근… 내 마니또를 확인할까?'))return;
    if(!state.assignments)state.assignments=derange();
    state.drawnBy[state.user]=true;
    save();
    secret();
  };
}
function me(){let u=person(state.user);$('#app').innerHTML=shell(`<section class="card"><div class="reveal">${u.face}</div><h2 style="text-align:center">${u.name}</h2><button id="logout" class="secondary">로그아웃</button></section><section class="card"><h3>게임 설정</h3><label>연말 파티 날짜</label><input id="date" class="field" type="date" value="${state.dDay}"><label>선물 최대 금액</label><input id="price" class="field" type="number" value="${state.giftLimit}"><button id="settings" class="primary">설정 저장</button></section>`);bindNav();$('#logout').onclick=()=>{state.user=null;selected=null;adminSequence=[];save();render()};$('#settings').onclick=()=>{if(!confirm('모두에게 보이는 게임 설정을 바꿀까?'))return;state.dDay=$('#date').value;state.giftLimit=Math.max(0,Number($('#price').value)||0);save();alert('저장했어!');render('me')}}
function adminLogin(){let pin=prompt('ADMIN PIN');if(pin!=='0922')return alert('관리자 PIN이 아니야.');admin()}
function admin(){let rows=state.assignments?PEOPLE.map(p=>`<p>${p.face} ${p.name} → ${person(state.assignments[p.id]).face} ${person(state.assignments[p.id]).name}${state.drawnBy[p.id]?' · 확인 완료':' · 아직 뽑기 전'}</p>`).join(''):'<p>아직 추첨 전</p>';$('#app').innerHTML=shell(`<section class="card admin"><h2>ADMIN</h2><p class="muted">일반 사용자에게는 숨겨진 관리 화면</p>${rows}<button id="redraw" class="danger">전체 재추첨</button><button id="reset" class="danger">추첨 초기화</button><button id="back" class="secondary">로그인 화면으로</button></section>`,false);$('#redraw').onclick=()=>{if(confirm('전체 관계를 새로 뽑을까? 모두에게 뽑기 화면이 다시 열려.')){state.assignments=derange();state.drawnBy={};save();admin()}};$('#reset').onclick=()=>{if(confirm('추첨 결과를 완전히 지울까?')){state.assignments=null;state.drawnBy={};save();admin()}};$('#back').onclick=()=>login()}
render();