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

drawerScripts.lotteryFields = [
  {
    label: 'Ngày',
    type: 'date',
    required: true,
    length: 10,
    name: 'date',
  },
  {
    label: 'Giải ĐB',
    type: 'number',
    required: true,
    length: 5,
    name: 'price_db',
  },
  {
    label: 'Giải nhất',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_1',
  },
  {
    label: 'Giải 2.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_21',
  },
  {
    label: 'Giải 2.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_22',
  },
  {
    label: 'Giải 3.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_31',
  },
  {
    label: 'Giải 3.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_32',
  },
  {
    label: 'Giải 3.3',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_33',
  },
  {
    label: 'Giải 3.4',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_34',
  },
  {
    label: 'Giải 3.5',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_35',
  },
  {
    label: 'Giải 3.6',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_36',
  },
  {
    label: 'Giải 4.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_41',
  },
  {
    label: 'Giải 4.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_42',
  },
  {
    label: 'Giải 4.3',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_43',
  },
  {
    label: 'Giải 4.4',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_44',
  },
  {
    label: 'Giải 5.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_51',
  },
  {
    label: 'Giải 5.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_52',
  },
  {
    label: 'Giải 5.3',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_53',
  },
  {
    label: 'Giải 5.4',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_54',
  },
  {
    label: 'Giải 5.5',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_55',
  },
  {
    label: 'Giải 5.6',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_56',
  },
  {
    label: 'Giải 6.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_61',
  },
  {
    label: 'Giải 6.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_62',
  },
  {
    label: 'Giải 6.3',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_63',
  },
  {
    label: 'Giải 7.1',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_71',
  },
  {
    label: 'Giải 7.2',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_72',
  },
  {
    label: 'Giải 7.3',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_73',
  },
  {
    label: 'Giải 7.4',
    type: 'number',
    length: 5,
    required: true,
    name: 'price_74',
  },
];
export default drawerScripts;
