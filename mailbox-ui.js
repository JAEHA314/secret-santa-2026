function mailboxSummaryHtml(total,mineCount=null){
  const mine=mineCount==null?'':`<p class="muted mailbox-my-count" style="text-align:center">내가 넣은 편지 <b>${mineCount}통</b></p>`;
  return `<section class="card mailbox-summary"><div class="mission-head"><div><span class="mission-kicker">MOOMOO MAILBOX</span><h2>무무클럽 우체통</h2></div></div><div style="font-size:44px;text-align:center;margin:12px 0">📮</div><p class="muted" style="text-align:center">지금까지 <b>${total}통</b>의 편지가 도착했어요.</p><p class="muted mailbox-party-note" style="text-align:center">연말 파티 날 다 같이 열어볼 수 있어요.</p>${mine}</section>`;
}

function mailboxPrompt(){
  return '편지를 써서 우체통에 넣어줘. 한 번 넣으면 연말 파티 전까지 본인도 다시 열어보거나 수정할 수 없어.';
}
