/*
 * Optional development-only smoke test helper.
 * This file is intentionally NOT loaded by index.html and therefore cannot change
 * production behavior. Paste/load it manually in a test session if needed.
 */
(function(){
  const required=['#app'];
  const report={missing:required.filter(s=>!document.querySelector(s)),duplicateIds:[]};
  const seen=new Set();
  document.querySelectorAll('[id]').forEach(el=>{
    if(seen.has(el.id)&&!report.duplicateIds.includes(el.id))report.duplicateIds.push(el.id);
    seen.add(el.id);
  });
  report.activeElement=document.activeElement?.tagName||null;
  report.inputs=[...document.querySelectorAll('input,textarea,select')].map(el=>({id:el.id||null,disabled:el.disabled,readOnly:el.readOnly}));
  report.buttons=[...document.querySelectorAll('button,[role="button"]')].map(el=>({id:el.id||null,disabled:Boolean(el.disabled),text:(el.textContent||'').trim().slice(0,40)}));
  console.table(report.inputs);
  console.table(report.buttons);
  console.log('[Secret Santa smoke test]',report);
  return report;
})();
