// Party mailbox archive export: renders all letters into 1080x1350 PNG pages.
(function(){
  const W=1080,H=1350,PAD=74,TOP=185,BOTTOM=70,GAP=24;
  let exportRows=[];
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  function wrapLines(ctx,text,maxWidth){
    const lines=[];String(text||'').split(/\n/).forEach(paragraph=>{
      if(!paragraph){lines.push('');return}
      let line='';
      for(const ch of paragraph){const test=line+ch;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=ch}else line=test}
      if(line)lines.push(line);
    });return lines;
  }
  function letterModel(x){
    const free=typeof freeMailboxMeta==='function'?freeMailboxMeta(x):null;
    const sender=person(x.sender_id),receiver=person(x.receiver_id),audience=partyMailboxAudience(x);
    const d=!free&&x.mission_id&&typeof missionDefinition==='function'?missionDefinition(x.mission_id):null;
    return {to:audience==='everyone'?'모두':(receiver?.name||'알 수 없음'),from:x.is_anonymous?'익명':(sender?.name||'알 수 없음'),mission:d?(typeof missionDisplayTitle==='function'?missionDisplayTitle(d):(d.action||'')):'',body:free?free.message:(x.message||''),date:formatMessageDate(x.created_at)};
  }
  function measureCard(ctx,m){
    ctx.font='700 24px system-ui, -apple-system, sans-serif';const mission=m.mission?36:0;
    ctx.font='500 34px system-ui, -apple-system, sans-serif';const lines=wrapLines(ctx,m.body,W-PAD*2-92);return Math.max(220,118+mission+lines.length*53+62);
  }
  function paginate(rows){
    const probe=document.createElement('canvas').getContext('2d');const pages=[];let page=[],used=TOP;
    rows.forEach(row=>{const m=letterModel(row),height=measureCard(probe,m);if(page.length&&used+height>H-BOTTOM){pages.push(page);page=[];used=TOP}page.push({m,height});used+=height+GAP});if(page.length)pages.push(page);return pages;
  }
  function drawPage(items,index,total){
    const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
    ctx.fillStyle='#eee7d8';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#214a38';ctx.fillRect(0,0,W,150);ctx.fillStyle='#b43d34';ctx.fillRect(0,146,W,8);
    ctx.fillStyle='#f5dca7';ctx.font='800 22px system-ui, -apple-system, sans-serif';ctx.fillText('OPEN MAILBOX · ARCHIVE',PAD,52);
    ctx.fillStyle='#fffdf4';ctx.font='900 46px system-ui, -apple-system, sans-serif';ctx.fillText('무무클럽 우체통',PAD,108);
    ctx.textAlign='right';ctx.font='700 21px system-ui, -apple-system, sans-serif';ctx.fillStyle='#e9e3d4';ctx.fillText(`${index+1} / ${total}`,W-PAD,102);ctx.textAlign='left';
    let y=TOP;
    items.forEach(({m,height})=>{
      ctx.save();ctx.shadowColor='rgba(55,40,25,.16)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;ctx.fillStyle='#fffdf8';roundRect(ctx,PAD,y,W-PAD*2,height,8);ctx.fill();ctx.restore();
      ctx.strokeStyle='#d6c8aa';ctx.lineWidth=2;roundRect(ctx,PAD,y,W-PAD*2,height,8);ctx.stroke();
      ctx.fillStyle='#8c3b34';ctx.font='800 22px system-ui, -apple-system, sans-serif';ctx.fillText(`TO. ${m.to}`,PAD+34,y+43);ctx.textAlign='right';ctx.fillText(`FROM. ${m.from}`,W-PAD-34,y+43);ctx.textAlign='left';
      let ty=y+84;if(m.mission){ctx.fillStyle='#999186';ctx.font='700 22px system-ui, -apple-system, sans-serif';ctx.fillText(m.mission,PAD+34,ty);ty+=40}
      ctx.fillStyle='#2d2924';ctx.font='500 34px system-ui, -apple-system, sans-serif';const lines=wrapLines(ctx,m.body,W-PAD*2-68);lines.forEach(line=>{ctx.fillText(line,PAD+34,ty);ty+=53});
      ctx.fillStyle='#9b927f';ctx.font='500 19px system-ui, -apple-system, sans-serif';ctx.textAlign='right';ctx.fillText(m.date,W-PAD-34,y+height-28);ctx.textAlign='left';y+=height+GAP;
    });
    ctx.fillStyle='#8c8172';ctx.font='600 18px system-ui, -apple-system, sans-serif';ctx.fillText('MUMU CLUB · SECRET SANTA 2026',PAD,H-32);return c;
  }
  function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지 생성 실패')),'image/png'))}
  async function saveCanvases(canvases){
    const files=[];for(let i=0;i<canvases.length;i++){const blob=await canvasBlob(canvases[i]);files.push(new File([blob],`mumu-mailbox-${String(i+1).padStart(2,'0')}.png`,{type:'image/png'}))}
    if(navigator.share&&navigator.canShare&&navigator.canShare({files})){try{await navigator.share({files,title:'무무클럽 우체통 기록'});return}catch(e){if(e&&e.name==='AbortError')return}}
    for(const file of files){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
  }
  async function exportMailboxImages(){
    const button=document.querySelector('#mailbox-export-images');if(button)button.disabled=true;
    try{if(typeof loadMissionDefinitions==='function')await loadMissionDefinitions();const rows=exportRows.length?exportRows:await loadAllMailboxLetters();if(!rows.length)return alert('내보낼 편지가 없어.');const pages=paginate(rows);const canvases=pages.map((p,i)=>drawPage(p,i,pages.length));await saveCanvases(canvases)}catch(e){console.error(e);alert('기록 이미지를 만들지 못했어.')}finally{if(button)button.disabled=false}
  }
  const basePartyMailboxHtml=partyMailboxHtml;
  partyMailboxHtml=function(rows){exportRows=rows.slice();const html=basePartyMailboxHtml(rows);return html.replace('<div class="party-letter-stack">',`<div class="mailbox-export-bar"><button id="mailbox-export-images" type="button">편지 기록 이미지 내보내기</button><small>1080 × 1350 · ${rows.length}통 전체</small></div><div class="party-letter-stack">`)};
  const baseBindPartyMailboxFilters=bindPartyMailboxFilters;
  bindPartyMailboxFilters=function(){baseBindPartyMailboxFilters();const button=document.querySelector('#mailbox-export-images');if(button)button.onclick=exportMailboxImages};
})();
