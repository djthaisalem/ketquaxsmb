const drawerScripts = {};

drawerScripts.show = (id) => {
  const drawer = document.getElementById('drawer-' + id);
  drawer.classList.add('drawer-show');
  const drawerForm = document.getElementById('drawer-form-' + id);
  drawerForm.classList.add('drawer-show');
};

drawerScripts.hide = (id) => {
  const drawer = document.getElementById('drawer-' + id);
  drawer.classList.remove('drawer-show');
  const drawerForm = document.getElementById('drawer-form-' + id);
  drawerForm.classList.remove('drawer-show');
};

export default drawerScripts;
