import axios from 'axios';
import queryString from 'query-string';
import { LOCAL_STORAGE_CONSTANTS } from '../constants/localStorageConstants';

const axiosClient = axios.create({
  // define base api url, header json type, and use query string param
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'content-type': 'application/json' },
  paramsSerializer: (params) => queryString.stringify(params),
});

// handle token for authorization
axiosClient.interceptors.request.use(async (config) => {
  const userToken = localStorage.getItem(LOCAL_STORAGE_CONSTANTS.TOKEN);

  if (userToken) {
    config.headers.authorization = userToken;
  }

  return config;
});

// if exist data, response that data
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data && 9999 === response.data.status_code) {
      return response.data.payload;
    }
    return response;
  },
  // handle error
  (error) => {
    throw error;
  },
);

export default axiosClient;
