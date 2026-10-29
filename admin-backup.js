// Admin-only full game backup / restore.
// Keeps the backup UI out of normal player screens and preserves real sender IDs for admin archives.
(function(){
  const BACKUP_FORMAT='mumu-secret-santa';
  const BACKUP_VERSION=1;
  const DATA_TABLES=[
    'assignments','player_missions','mission_passes','secret_messages','mailbox_letters',
    'board_posts','wishlists','player_moods','party_guesses','party_reveals','assignment_exclusions'
  ];
  const ALL_TABLES=['players','mission_definitions','game_settings',...DATA_TABLES];

  async function backupFetchTable(table){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`,{headers:apiHeaders});
    if(!r.ok)throw new Error(`${table} 불러오기 실패 (${r.status})`);
    return r.json();
  }

  function backupCount(data,key){return Array.isArray(data&&data[key])?data[key].length:0}
  function backupSummary(data){
    return [
      `우체통 편지 ${backupCount(data,'mailbox_letters')}개`,
      `메시지 ${backupCount(data,'secret_messages')}개`,
      `자유게시판 ${backupCount(data,'board_posts')}개`,
      `사용자 미션 ${backupCount(data,'player_missions')}개`,
      `미션 설정 ${backupCount(data,'mission_definitions')}개`
    ].join(' · ');
  }

  async function createAdminBackup(){
    const data={};
    for(const table of ALL_TABLES)data[table]=await backupFetchTable(table);
    return {
      backup_format:BACKUP_FORMAT,
      backup_version:BACKUP_VERSION,
      exported_at:new Date().toISOString(),
      app:'Secret Santa 2026',
      people:PEOPLE.map(p=>({id:p.id,name:p.name})),
      data
    };
  }

  function downloadBackupFile(backup){
    const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`mumu-secret-santa-backup-${stamp}.json`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function validateBackup(x){
    if(!x||x.backup_format!==BACKUP_FORMAT)throw new Error('무무클럽 Secret Santa 백업 파일이 아니야.');
    if(Number(x.backup_version)!==BACKUP_VERSION)throw new Error(`지원하지 않는 백업 버전이야. (v${x.backup_version||'?'})`);
    if(!x.data||typeof x.data!=='object')throw new Error('백업 데이터가 비어 있어.');
    for(const table of ALL_TABLES)if(!Array.isArray(x.data[table]))throw new Error(`${table} 데이터가 없는 백업이야.`);
    return x;
  }

  async function clearRestoreTable(table){
    const columns={
      assignments:'giver_id',player_missions:'player_id',mission_passes:'player_id',secret_messages:'sender_id',
      mailbox_letters:'sender_id',board_posts:'player_id',wishlists:'player_id',player_moods:'player_id',
      party_guesses:'player_id',party_reveals:'player_id',assignment_exclusions:'giver_id'
    };
    const col=columns[table];
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=not.is.null`,{method:'DELETE',headers:apiHeaders});
    if(!r.ok)throw new Error(`${table} 기존 데이터 삭제 실패 (${r.status})`);
  }

  async function insertRestoreRows(table,rows){
    if(!rows.length)return;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:'POST',headers:{...apiHeaders,Prefer:'return=minimal'},body:JSON.stringify(rows)});
    if(!r.ok){const detail=await r.text().catch(()=>'');throw new Error(`${table} 복원 실패 (${r.status}) ${detail}`)}
  }

  async function restoreAdminBackup(backup){
    const d=backup.data;
    // Game settings and player identities already exist. Restore only mutable player fields.
    for(const p of d.players){
      if(!p||!p.id)continue;
      const payload={pin:p.pin??null,drawn:!!p.drawn};
      const r=await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${encodeURIComponent(p.id)}`,{method:'PATCH',headers:apiHeaders,body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(`players(${p.id}) 복원 실패 (${r.status})`);
    }

    if(d.game_settings.length){
      const g={...d.game_settings[0]};delete g.id;
      const r=await fetch(`${SUPABASE_URL}/rest/v1/game_settings?id=eq.1`,{method:'PATCH',headers:apiHeaders,body:JSON.stringify(g)});
      if(!r.ok)throw new Error(`game_settings 복원 실패 (${r.status})`);
    }

    if(d.mission_definitions.length){
      const r=await fetch(`${SUPABASE_URL}/rest/v1/mission_definitions?on_conflict=id`,{method:'POST',headers:{...apiHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(d.mission_definitions)});
      if(!r.ok)throw new Error(`mission_definitions 복원 실패 (${r.status})`);
    }

    for(const table of DATA_TABLES)await clearRestoreTable(table);
    for(const table of DATA_TABLES)await insertRestoreRows(table,d[table]);

    await Promise.all([loadPins(),loadGame(),loadAssignmentExclusions(),loadMissionDefinitions(),loadSharedSettings()]);
    try{await loadWishlists()}catch(e){}
  }

  const baseAdminGamePanel=adminGamePanel;
  adminGamePanel=function(){
    const html=baseAdminGamePanel();
    const backup=`<section class="admin-backup-section"><h3>게임 데이터 백업</h3><p class="small muted">PIN, 추첨, 관리자 수정 미션, 미션 진행, 메시지, 우체통, 자유게시판, WISH, 상태, 파티 기록과 설정을 JSON으로 보관해. 익명 편지도 실제 작성자 ID를 포함해 관리자 백업에 저장돼.</p><div class="admin-backup-actions"><button id="admin-backup-download" class="secondary" type="button">JSON 백업 다운로드</button><button id="admin-backup-restore" class="secondary" type="button">JSON 백업 불러오기</button><input id="admin-backup-file" type="file" accept="application/json,.json" hidden></div><p id="admin-backup-status" class="small muted admin-backup-status"></p></section>`;
    return html.replace('</section>',`${backup}</section>`);
  };

  const baseBindAdminGame=bindAdminGame;
  bindAdminGame=function(){
    baseBindAdminGame();
    const download=$('#admin-backup-download'),restore=$('#admin-backup-restore'),file=$('#admin-backup-file'),status=$('#admin-backup-status');
    if(download)download.onclick=async()=>{
      download.disabled=true;if(status)status.textContent='현재 게임 데이터를 모으는 중…';
      try{const backup=await createAdminBackup();downloadBackupFile(backup);if(status)status.textContent=`백업 완료 · ${backupSummary(backup.data)}`}
      catch(e){console.error(e);alert(`백업하지 못했어. ${e.message||''}`);if(status)status.textContent='백업 실패'}
      finally{download.disabled=false}
    };
    if(restore&&file){
      restore.onclick=()=>file.click();
      file.onchange=async()=>{
        const chosen=file.files&&file.files[0];if(!chosen)return;
        try{
          const backup=validateBackup(JSON.parse(await chosen.text()));
          const when=backup.exported_at?new Date(backup.exported_at).toLocaleString('ko-KR'):'알 수 없음';
          if(!confirm(`백업 파일을 확인했어.\n\n백업 시각: ${when}\n${backupSummary(backup.data)}\n\n현재 게임 데이터를 이 백업으로 교체할까?`))return;
          if(!confirm('복원을 시작하면 현재 플레이 기록을 백업 파일의 기록으로 교체해. 계속할까?'))return;
          restore.disabled=true;if(status)status.textContent='백업 데이터를 복원하는 중…';
          await restoreAdminBackup(backup);
          alert('백업 복원이 완료됐어.');
          admin();
        }catch(e){console.error(e);alert(`백업을 불러오지 못했어. ${e.message||''}`);if(status)status.textContent='복원 실패'}
        finally{restore.disabled=false;file.value=''}
      };
    }
  };
})();
