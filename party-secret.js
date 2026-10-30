// Party-day SECRET extension: preserve character colors and, after every reveal, keep only the two Secret Santa identity cards.
const partySecretBase=secret;
secret=async function(){
  let party=null;
  try{party=await loadPartyState()}catch(e){console.warn('party secret state',e)}
  const allRevealed=Boolean(party&&party.reveals.length>=PEOPLE.length);
  // Keep the SECRET view hidden while its async data finishes rendering so the
  // receiver name never flashes in the default black before its character color is applied.
  $('#app').style.visibility='hidden';
  try{
    await partySecretBase();
    try{await loadGame()}catch(e){console.warn('secret assignment color',e)}
    const receiverId=state.assignments&&state.assignments[state.user];
    const receiver=receiverId&&person(receiverId);
    if(receiver){
      document.querySelectorAll('.secret-page h2,.secret-page b,.secret-page strong').forEach(el=>{
        if(el.textContent.trim()===receiver.name){el.classList.add(`character-${receiver.id}`);el.style.webkitTextFillColor='currentColor'}
      });
    }
    if(!allRevealed)return;
    const giverId=partyActualGiver(state.user);
    const giver=giverId&&person(giverId);
    if(!giver)return;
    const page=document.querySelector('.secret-page');
    if(!page)return;
    page.querySelectorAll('.mission-card').forEach(card=>card.remove());
    if(!page.querySelector('.secret-giver-card')){
      const card=document.createElement('section');
      card.className='card secret-person-card secret-giver-card';
      card.innerHTML=`<h2>나를 챙겨준 사람은…</h2><div class="reveal">${visual(giver,'reveal-img')}</div><h2 class="character-${giver.id}" style="text-align:center">${esc(giver.name)}</h2>`;
      const identity=page.querySelector('.secret-person-card');
      if(identity)identity.insertAdjacentElement('afterend',card);
      else page.appendChild(card);
    }
  }catch(e){console.warn('party secret giver',e)}
  finally{$('#app').style.visibility=''}
};
