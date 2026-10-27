const mailboxBaseHome=home;
const mailboxBaseMe=me;
const mailboxBaseSecret=secret;

function mailboxSummaryHtml(total,mineCount=null){
  const mine=mineCount==null?'':`<p class="muted mailbox-my-count" style="text-align:center">내가 넣은 편지 <b>${mineCount}통</b></p>`;
  return `<section class="card mailbox-summary"><div class="mission-head"><div><span class="mission-kicker">MOOMOO MAILBOX</span><h2>무무클럽 우체통</h2></div></div><div style="font-size:44px;text-align:center;margin:12px 0">📮</div><p class="muted" style="text-align:center">지금까지 <b>${total}통</b>의 편지가 도착했어요.</p><p class="muted mailbox-party-note" style="text-align:center">연말 파티 날 다 같이 열어볼 수 있어요.</p>${mine}</section>`;
}

home=async function(){
  await mailboxBaseHome();
  let box={total:0,mine:[]};
  try{box=await loadMailboxCounts()}catch(e){console.warn(e)}
  const stats=document.querySelector('.stats');
  if(stats)stats.insertAdjacentHTML('beforebegin',mailboxSummaryHtml(box.total,box.mine.length));
};

me=async function(){
  await mailboxBaseMe();
  let box={total:0,mine:[]};
  try{box=await loadMailboxCounts()}catch(e){console.warn(e)}
  const main=document.querySelector('main');
  if(main)main.insertAdjacentHTML('beforeend',mailboxMineHtml(box.mine));
};

function mailboxPrompt(){
  return '편지를 써서 우체통에 넣어줘. 한 번 넣으면 연말 파티 전까지 본인도 다시 열어보거나 수정할 수 없어.';
}

secret=async function(){
  await mailboxBaseSecret();
  let rows=[];
  try{rows=await ensureMissions()}catch(e){return}
  const current=rows.find(x=>x.status==='pending');
  const m=current&&MISSIONS.find(x=>x.id===current.mission_id);
  if(!m||m.type!=='mailbox')return;
  const card=document.querySelector('.mission-card');
  if(!card)return;
  const muted=card.querySelector('.muted');
  if(muted)muted.textContent=mailboxPrompt();
  const oldNote=card.querySelector('#mission-note');
  if(oldNote){oldNote.id='mailbox-letter';oldNote.placeholder='봉인할 편지를 적어줘';}
  const oldComplete=card.querySelector('#mission-complete');
  if(oldComplete){
    oldComplete.textContent='우체통에 넣기';
    oldComplete.onclick=async()=>{
      const text=$('#mailbox-letter').value.trim();
      if(!text)return alert('편지 내용을 적어줘.');
      if(!confirm('✉️ 우체통에 넣으면 연말 파티 전까지 본인도 다시 열어보거나 수정할 수 없어요.\n\n정말 우체통에 넣을까요?'))return;
      oldComplete.disabled=true;
      try{
        await putMailboxLetter(text,m.id);
        await completeMission(current,'편지를 우체통에 넣었어요.');
        alert('편지를 우체통에 넣었어! 연말 파티 날 다시 만나자.');
        secret();
      }catch(e){
        oldComplete.disabled=false;
        alert('편지를 넣지 못했어. 다시 시도해줘.');
      }
    };
  }
};