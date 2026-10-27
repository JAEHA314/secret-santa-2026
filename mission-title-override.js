// Mission titles are authored as complete user-facing sentences. target/type remain admin-only routing metadata.
const legacyMissionDisplayTitle=missionDisplayTitle;
missionDisplayTitle=function(m){if(!m)return '';const d=m.id?missionDefinition(m.id):m;if(!d)return m.title||'';const action=String(d.action||'').trim();if(!d.particle)return action;return `${d.target||''}${d.particle||''} ${action}`.trim()};
const legacySaveMissionDefinition=saveMissionDefinition;
saveMissionDefinition=async function(d){return legacySaveMissionDefinition({...d,particle:''})};
