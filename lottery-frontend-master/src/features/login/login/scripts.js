import loginAPI from '../../../api/login.api';
import { LOCAL_STORAGE_CONSTANTS } from '../../../constants/localStorageConstants';
import { aesUtil } from '../../../utils/aesUtils';

const loginScript = {};

loginScript.fields = [
  {
    label: 'Số điện thoại',
    type: 'number',
    placeHolder: 'Nhập số điện thoại',
    required: true,
    length: 10,
    minLength: 10,
    name: 'phone',
  },
  {
    label: 'Mật khẩu',
    type: 'text',
    placeHolder: 'Nhập mật khẩu',
    length: 0,
    minLength: 8,
    required: true,
    name: 'password',
  },
];

loginScript.handleLogin = async (data) => {
  if ('0981341899' === data.phone) {
    data.business_type = 'owner';
  } else {
    data.business_type = 'admin';
  }
  const respose = await loginAPI.login(data);
  if (respose && respose.payload) {
    const payload = JSON.parse(respose.payload);

    if (payload && payload.access_token) {
      localStorage.setItem(
        LOCAL_STORAGE_CONSTANTS.TOKEN,
        aesUtil.encrypt('Bearer ' + payload.access_token),
      );
      return true;
    }
    return false;
  }
};

export default loginScript;
