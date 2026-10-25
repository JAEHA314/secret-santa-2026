let assignmentExclusions=[];

async function loadAssignmentExclusions(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/assignment_exclusions?select=giver_id,receiver_id&order=giver_id.asc`,{headers:apiHeaders});
  if(!r.ok)throw new Error('exclusion load');
  assignmentExclusions=await r.json();
  return assignmentExclusions;
}

async function addAssignmentExclusion(giverId,receiverId){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/assignment_exclusions`,{method:'POST',headers:apiHeaders,body:JSON.stringify({giver_id:giverId,receiver_id:receiverId})});
  if(!r.ok)throw new Error('exclusion add');
  await loadAssignmentExclusions();
}

async function removeAssignmentExclusion(giverId,receiverId){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/assignment_exclusions?giver_id=eq.${encodeURIComponent(giverId)}&receiver_id=eq.${encodeURIComponent(receiverId)}`,{method:'DELETE',headers:apiHeaders});
  if(!r.ok)throw new Error('exclusion remove');
  await loadAssignmentExclusions();
}

function isAssignmentExcluded(giverId,receiverId){
  return assignmentExclusions.some(x=>x.giver_id===giverId&&x.receiver_id===receiverId);
}

// 본인 배정 + 관리자가 지정한 관계를 모두 피하는 완전 매칭을 찾는다.
derange=function(){
  const ids=PEOPLE.map(p=>p.id);
  for(let attempt=0;attempt<10000;attempt++){
    const to=shuffle(ids);
    if(ids.every((giver,i)=>giver!==to[i]&&!isAssignmentExcluded(giver,to[i]))){
      return Object.fromEntries(ids.map((giver,i)=>[giver,to[i]]));
    }
  }
  throw new Error('조건을 모두 만족하는 마니또 조합이 없어. 제외 관계를 줄여줘.');
};

// 어느 멤버가 첫 추첨을 눌러도 최신 제외 관계를 먼저 읽고 추첨한다.
const exclusionsBaseCreateAssignmentsIfNeeded=createAssignmentsIfNeeded;
createAssignmentsIfNeeded=async function(){
  await loadGame();
  if(state.assignments&&Object.keys(state.assignments).length===PEOPLE.length)return state.assignments;
  try{await loadAssignmentExclusions()}catch(e){throw new Error('제외 관계 설정을 불러오지 못했어.')}
  return exclusionsBaseCreateAssignmentsIfNeeded();
};

const exclusionsBaseAdminLogin=adminLogin;
adminLogin=function(){
  const pin=prompt('ADMIN PIN');
  if(pin!=='0922')return alert('관리자 PIN이 아니야.');
  Promise.all([loadPins(),loadGame(),loadAssignmentExclusions()]).then(admin).catch(()=>alert('관리자 설정을 불러오지 못했어. assignment_exclusions 테이블을 확인해줘.'));
};

const exclusionsBaseAdmin=admin;
admin=function(){
  exclusionsBaseAdmin();
  const adminCard=document.querySelector('.card.admin');
  const list=adminCard&&adminCard.querySelector('.admin-list');
  if(!adminCard||!list)return;

  const options=PEOPLE.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  const rows=assignmentExclusions.length
    ? assignmentExclusions.map(x=>`<div class="admin-row exclusion-row"><div class="admin-main">${adminPerson(person(x.giver_id))}<span>→</span>${adminPerson(person(x.receiver_id))}<button class="pin-reset" data-remove-exclusion="${x.giver_id}|${x.receiver_id}">삭제</button></div></div>`).join('')
    : '<p class="small muted">설정된 제외 관계가 없어.</p>';

  list.insertAdjacentHTML('beforebegin',`<div class="admin-exclusions"><h3>추첨 제외 관계</h3><p class="small muted">작년과 같은 사람이 걸리지 않게, ‘누가 → 누구를 챙기지 않게 할지’ 설정해. 추첨 초기화 후 새로 만들어지는 관계부터 적용돼.</p><div class="exclusion-picker"><select id="exclude-giver" class="field">${options}</select><span>→</span><select id="exclude-receiver" class="field">${options}</select></div><button id="add-exclusion" class="secondary">제외 관계 추가</button><div class="admin-exclusion-list">${rows}</div></div>`);

  const giver=$('#exclude-giver'),receiver=$('#exclude-receiver');
  if(receiver&&receiver.options.length>1)receiver.selectedIndex=1;
  $('#add-exclusion').onclick=async()=>{
    if(giver.value===receiver.value)return alert('본인은 원래 자동으로 제외돼. 다른 사람을 선택해줘.');
    if(isAssignmentExcluded(giver.value,receiver.value))return alert('이미 설정된 관계야.');
    try{await addAssignmentExclusion(giver.value,receiver.value);admin()}catch(e){alert('제외 관계를 저장하지 못했어.')}
  };
  document.querySelectorAll('[data-remove-exclusion]').forEach(b=>b.onclick=async()=>{
    const [g,r]=b.dataset.removeExclusion.split('|');
    try{await removeAssignmentExclusion(g,r);admin()}catch(e){alert('제외 관계를 삭제하지 못했어.')}
  });
};