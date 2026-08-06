const headerScripts = {};

headerScripts.showProfilePanel = () => {
  const profilePanel = document.getElementById('profile-panel');
  profilePanel.classList.add('profile-panel-show');
};

headerScripts.hideProfilePanel = () => {
  const profilePanel = document.getElementById('profile-panel');
  profilePanel.classList.remove('profile-panel-show');
};

export default headerScripts;
