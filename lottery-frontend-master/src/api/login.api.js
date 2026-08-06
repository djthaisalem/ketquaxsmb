import { aesUtil } from '../utils/aesUtils';
import axiosClient from './axiosClient';

const loginAPI = {
  login: (data) => {
    const URL = '/login';
    return axiosClient.post(URL, aesUtil.encryptBody(data));
  },
};

export default loginAPI;
