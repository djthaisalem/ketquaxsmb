const sideMenuScripts = {};

sideMenuScripts.showMenu = () => {
  const menu = document.getElementById('menu');
  menu.classList.add('menu-show');
};

sideMenuScripts.hideMenu = () => {
  const menu = document.getElementById('menu');
  menu.classList.remove('menu-show');
};

export default sideMenuScripts;
