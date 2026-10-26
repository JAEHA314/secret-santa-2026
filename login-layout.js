// Login-only layout marker. Keeps the first screen inside one viewport even after PIN opens.
const loginLayoutBaseLogin=login;
login=function(){
  loginLayoutBaseLogin();
  const main=document.querySelector('#app main');
  if(main)main.classList.add('login-page');
};
