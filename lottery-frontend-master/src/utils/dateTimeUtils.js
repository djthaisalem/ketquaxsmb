import { DateTimeFormat } from '../constants/DateConstants';
const dateTimeUtils = {};
dateTimeUtils.formatDate = (date, format) => {
  if (!date) {
    return '';
  }
  var d = new Date(date);

  if (d instanceof Date && d.getTime()) {
    const year = d.getFullYear(),
      month =
        d.getMonth() + 1 >= 10 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1),
      date = d.getDate() >= 10 ? d.getDate() : '0' + d.getDate(),
      day = d.getDay(),
      hour = d.getHours() >= 10 ? d.getHours() : '0' + d.getHours(),
      minute = d.getMinutes() >= 10 ? d.getMinutes() : '0' + d.getMinutes(),
      second = d.getSeconds() >= 10 ? d.getSeconds() : '0' + d.getSeconds();

    // hour in 24 hours format

    let dayString = '';
    switch (format) {
      case DateTimeFormat.DATE_DAY_OF_WEEK: {
        if (day === 0) dayString = 'Chủ nhật';
        if (day === 1) dayString = 'Thứ hai';
        if (day === 2) dayString = 'Thứ ba';
        if (day === 3) dayString = 'Thứ tư';
        if (day === 4) dayString = 'Thứ năm';
        if (day === 5) dayString = 'Thứ sáu';
        if (day === 6) dayString = 'Thứ bảy';

        return dayString + ', ' + [date, month, year].join('/');
      }
      case DateTimeFormat.FULL_DASHED:
        return [year, month, date, hour, minute, second].join('-');
      case DateTimeFormat.DATE_DASHED_REVERSE:
        return [year, month, date].join('-');
      case DateTimeFormat.DATE:
        return [date, month, year].join('/');
      case DateTimeFormat.DATE_TIME:
        return [hour, minute].join(':') + ' ' + [date, month, year].join('/');
      case DateTimeFormat.DATE_TIME_SECOND:
        return (
          [hour, minute, second].join(':') + ' ' + [date, month, year].join('/')
        );
      case DateTimeFormat.TIME:
        return [hour, minute, second].join(':');
      case DateTimeFormat.TIME_SECOND:
        return [hour, minute].join(':');
      default:
        return [date, month, year].join('/');
    }
  } else {
    return '';
  }
};

dateTimeUtils.parseDateFromString = (string) => {
  let splits = string.split('/');
  return new Date(+splits[2], splits[1] - 1, +splits[0]);
};

dateTimeUtils.convertYYYYMMddToddMMYYY = (string) => {
  let splits = string.split('-');
  return splits[2] + '/' + splits[1] + '/' + splits[0];
};
export default dateTimeUtils;
