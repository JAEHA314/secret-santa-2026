// Party-day SECRET extension: after every reveal, keep only the two Secret Santa identity cards.
const partySecretBase=secret;
secret=async function(){
  await partySecretBase();
  try{
    const party=await loadPartyState();
    if(party.reveals.length<PEOPLE.length)return;
    await loadGame();
    const giverId=partyActualGiver(state.user);
    const giver=giverId&&person(giverId);
    if(!giver)return;
    const page=document.querySelector('.secret-page');
    if(!page)return;
    page.querySelectorAll('.mission-card').forEach(card=>card.remove());
    if(page.querySelector('.secret-giver-card'))return;
    const card=document.createElement('section');
    card.className='card secret-person-card secret-giver-card';
    card.innerHTML=`<h2>나를 챙겨준 사람은…</h2><div class="reveal">${visual(giver,'reveal-img')}</div><h2 class="character-${giver.id}" style="text-align:center">${esc(giver.name)}</h2>`;
    const identity=page.querySelector('.secret-person-card');
    if(identity)identity.insertAdjacentElement('afterend',card);
    else page.appendChild(card);
  }catch(e){console.warn('party secret giver',e)}
};
