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
  const PERSON_IDS=new Set(PEOPLE.map(p=>p.id));

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

  function downloadBackupFile(backup,prefix='mumu-secret-santa-backup'){
    const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${prefix}-${stamp}.json`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function assertPerson(id,label,allowNull=false){
    if((id===null||id===undefined||id==='')&&allowNull)return;
    if(!PERSON_IDS.has(id))throw new Error(`${label}에 알 수 없는 사용자 ID(${id})가 있어.`);
  }
  function assertUnique(rows,keyFn,label){
    const seen=new Set();
    for(const row of rows){const key=keyFn(row);if(seen.has(key))throw new Error(`${label}에 중복 데이터(${key})가 있어.`);seen.add(key)}
  }

  function validateBackup(x){
    if(!x||x.backup_format!==BACKUP_FORMAT)throw new Error('무무클럽 Secret Santa 백업 파일이 아니야.');
    if(Number(x.backup_version)!==BACKUP_VERSION)throw new Error(`지원하지 않는 백업 버전이야. (v${x.backup_version||'?'})`);
    if(!x.data||typeof x.data!=='object')throw new Error('백업 데이터가 비어 있어.');
    for(const table of ALL_TABLES)if(!Array.isArray(x.data[table]))throw new Error(`${table} 데이터가 없는 백업이야.`);
    const d=x.data;
    const playerIds=d.players.map(p=>p&&p.id);
    if(playerIds.length!==PEOPLE.length||new Set(playerIds).size!==PEOPLE.length||playerIds.some(id=>!PERSON_IDS.has(id)))throw new Error('사용자 6명의 정보가 완전하지 않은 백업이야.');
    if(d.mission_definitions.length!==25)throw new Error(`미션 설정이 25개가 아니야. (${d.mission_definitions.length}개)`);
    assertUnique(d.mission_definitions,r=>String(r.id),'미션 설정');
    assertUnique(d.assignments,r=>r.giver_id,'마니또 배정');
    assertUnique(d.player_missions,r=>`${r.player_id}|${r.mission_id}`,'사용자 미션');
    assertUnique(d.wishlists,r=>r.player_id,'위시리스트');
    assertUnique(d.player_moods,r=>r.player_id,'상태');
    assertUnique(d.party_guesses,r=>r.player_id,'파티 추측');
    assertUnique(d.party_reveals,r=>r.player_id,'파티 공개');
    for(const r of d.assignments){assertPerson(r.giver_id,'마니또 배정');assertPerson(r.receiver_id,'마니또 배정')}
    for(const r of d.player_missions)assertPerson(r.player_id,'사용자 미션');
    for(const r of d.mission_passes)assertPerson(r.player_id,'PASS 기록');
    for(const r of d.secret_messages){assertPerson(r.sender_id,'메시지');assertPerson(r.receiver_id,'메시지')}
    for(const r of d.mailbox_letters){assertPerson(r.sender_id,'우체통 편지');assertPerson(r.receiver_id,'우체통 편지')}
    for(const r of d.board_posts)assertPerson(r.player_id,'자유게시판');
    for(const r of d.wishlists)assertPerson(r.player_id,'위시리스트');
    for(const r of d.player_moods)assertPerson(r.player_id,'상태');
    for(const r of d.party_guesses){assertPerson(r.player_id,'파티 추측');assertPerson(r.guessed_giver_id,'파티 추측',true)}
    for(const r of d.party_reveals)assertPerson(r.player_id,'파티 공개');
    for(const r of d.assignment_exclusions){assertPerson(r.giver_id,'추첨 제외');assertPerson(r.receiver_id,'추첨 제외')}
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

  async function applyAdminBackup(backup){
    const d=backup.data;
    for(const p of d.players){
      const payload={pin:p.pin??null,drawn:!!p.drawn};
      const r=await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${encodeURIComponent(p.id)}`,{method:'PATCH',headers:apiHeaders,body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(`players(${p.id}) 복원 실패 (${r.status})`);
    }
    if(d.game_settings.length){
      const g={...d.game_settings[0]};delete g.id;
      const r=await fetch(`${SUPABASE_URL}/rest/v1/game_settings?id=eq.1`,{method:'PATCH',headers:apiHeaders,body:JSON.stringify(g)});
      if(!r.ok)throw new Error(`game_settings 복원 실패 (${r.status})`);
    }
    const defs=d.mission_definitions.map(({updated_at,...rest})=>rest);
    const mr=await fetch(`${SUPABASE_URL}/rest/v1/mission_definitions?on_conflict=id`,{method:'POST',headers:{...apiHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(defs)});
    if(!mr.ok)throw new Error(`mission_definitions 복원 실패 (${mr.status})`);
    for(const table of DATA_TABLES)await clearRestoreTable(table);
    for(const table of DATA_TABLES)await insertRestoreRows(table,d[table]);
    await Promise.all([loadPins(),loadGame(),loadAssignmentExclusions(),loadMissionDefinitions(),loadSharedSettings()]);
    try{await loadWishlists()}catch(e){}
  }

  async function restoreAdminBackup(backup){
    validateBackup(backup);
    const safety=await createAdminBackup();
    downloadBackupFile(safety,'mumu-secret-santa-before-restore');
    try{
      await applyAdminBackup(backup);
    }catch(originalError){
      console.error('restore failed; attempting rollback',originalError);
      try{await applyAdminBackup(validateBackup(safety))}
      catch(rollbackError){console.error('rollback failed',rollbackError);throw new Error(`${originalError.message||originalError} / 자동 원상복구도 실패했어. 방금 다운로드된 복원 직전 백업 파일을 보관해줘.`)}
      throw new Error(`${originalError.message||originalError} / 변경 전 상태로 자동 복구했어.`);
    }
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
          if(!confirm('복원 직전에 현재 상태를 안전 백업으로 자동 다운로드한 뒤 복원을 시작해. 계속할까?'))return;
          restore.disabled=true;if(status)status.textContent='복원 직전 안전 백업을 만든 뒤 데이터를 복원하는 중…';
          await restoreAdminBackup(backup);
          alert('백업 복원이 완료됐어. 복원 직전 상태도 별도 JSON으로 다운로드했어.');
          admin();
        }catch(e){console.error(e);alert(`백업을 불러오지 못했어. ${e.message||''}`);if(status)status.textContent='복원 실패'}
        finally{restore.disabled=false;file.value=''}
      };
    }
  };
})();
