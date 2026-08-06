const Helper = {};

/*
 * format date to specific format
 */
Helper.formatDate = (d, format) => {
  const year = d.getFullYear(),
    month =
      d.getMonth() + 1 >= 10 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1),
    day = d.getDate() >= 10 ? d.getDate() : '0' + d.getDate(),
    hour = d.getHours() >= 10 ? d.getHours() : '0' + d.getHours(),
    minute = d.getMinutes() >= 10 ? d.getMinutes() : '0' + d.getMinutes(),
    second = d.getSeconds() >= 10 ? d.getSeconds() : '0' + d.getSeconds();

  switch (format) {
    case 'yyyy-MM-dd-hh-mm-ss':
      return [year, month, day, hour, minute, second].join('-');
    case 'dd/MM/yyyy':
      return [day, month, year].join('/');
    case 'dd/MM/yyy hh:mm':
      return [day, month, year].join('/') + ' ' + [hour, minute].join(':');
    case 'dd/MM/yyy hh:mm:ss':
      return (
        [day, month, year].join('/') + ' ' + [hour, minute, second].join(':')
      );

    default:
      return [day, month, year].join('/');
  }
};

export default Helper;
