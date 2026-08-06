import axiosClient from './axiosClient';

const lotteryApi = {
  reportByBacNho: (data, reportType) => {
    let URL = '';
    if ('price' === reportType) {
      URL = '/lottery/report/by_price';
    } else if ('miss_head' === reportType) {
      URL = '/lottery/report/miss/head';
    } else if ('miss_tail' === reportType) {
      URL = '/lottery/report/miss/tail';
    } else if ('double' === reportType) {
      URL = '/lottery/report/double';
    } else if ('triple' === reportType) {
      URL = '/lottery/report/triple';
    } else if ('two_number' === reportType) {
      URL = '/lottery/report/two_number';
    } else if ('three_numbers' === reportType) {
      URL = '/lottery/report/three_numbers';
    }
    return axiosClient.post(URL, data);
  },

  getNewest: () => {
    const URL = '/lottery/get/newest';
    return axiosClient.get(URL);
  },
  getByDate: (date) => {
    const URL = '/lottery/get/by_date?date=' + date;
    return axiosClient.get(URL);
  },
  addOrUpdate: (data) => {
    const URL = '/lottery/add_or_update';
    return axiosClient.post(URL, { ...data });
  },
  addMany: (data) => {
    const URL = '/craw/by/date?from_date=' + data.from + '&to_date=' + data.to;
    return axiosClient.get(URL);
  },
  checkData: (data) => {
    const URL =
      '/lottery/check_data?from_date=' + data.from + '&to_date=' + data.to;
    return axiosClient.get(URL);
  },
};

export default lotteryApi;
