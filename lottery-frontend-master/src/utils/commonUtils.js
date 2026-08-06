import { FORM_VALIDATE_MESSAGE } from '../constants/formConstants';

const commonUtils = {};
// form validate

commonUtils.validateForm = (fields, data) => {
  let errs = [];
  for (const field of fields) {
    const value = data[field.name];
    // empty field
    if (field.required && (!value || value === '')) {
      errs.push({
        field: field.name,
        message: FORM_VALIDATE_MESSAGE.REQUIRED.replace('{name}', field.label),
      });
      continue;
    }

    // vượt số lượng kí tự
    if (field.length > 0 && value && value.length > field.length) {
      errs.push({
        field: field.name,
        message: FORM_VALIDATE_MESSAGE.MAX_LENGTH.replace(
          '{name}',
          field.label,
        ).replace('{length}', field.length),
      });
      continue;
    }
    // chưa đủ số lượng kí tự
    if (field.minLength > 0 && value && value.length < field.minLength) {
      errs.push({
        field: field.name,
        message: FORM_VALIDATE_MESSAGE.MIN_LENGTH.replace(
          '{name}',
          field.label,
        ).replace('{length}', field.minLength),
      });
      continue;
    }
  }
  return errs;
};

commonUtils.formatReportData = (raw) => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const result = raw
    .map((ele) => {
      if (ele.data && ele.data.length) {
        let items = ele.data.map((childEle) => {
          let item = { ...childEle };
          let num1 = item.data_by_number.filter(
            (f) => f.number === item.collection[0],
          );

          if (num1 && num1.length) {
            item.n1d1 = num1[0].day_1;
            item.n1d2 = num1[0].day_2;
            item.n1d3 = num1[0].day_3;
          }
          let num2 = item.data_by_number.filter(
            (f) => f.number === item.collection[1],
          );
          if (num2 && num2.length) {
            item.n2d1 = num2[0].day_1;
            item.n2d2 = num2[0].day_2;
            item.n2d3 = num2[0].day_3;
          }

          item.data_by_number = null;
          item.collection = item.collection[0] + ',' + item.collection[1];
          item.data_by_date = null;

          return item;
        });
        let item = items[0];
        items.splice(0, 1);
        item.target = ele.target;
        item.subRows = items;
        return item;
      } else {
        return undefined;
      }
    })
    .filter((f) => f !== undefined);

  return result;
};

commonUtils.formatDaylyResultData = (raw) => {
  if (!(raw instanceof Object)) {
    return [];
  }
  let result = ['db', '1', '2', '3', '4', '5', '6', '7'];

  result = result.map((ele) => {
    let value = '';
    if ('db' === ele || '1' === ele) {
      value = raw['price_' + ele];
    } else {
      let list1 = [];
      let list2 = [];
      for (let i = 1; i <= 6; i++) {
        let tmpVal = raw['price_' + ele + i];
        if (tmpVal !== undefined) {
          if (list1.length < 3 || '4' === ele || '7' === ele) {
            list1.push(tmpVal);
          } else {
            list2.push(tmpVal);
          }
        }
      }
      value = list1.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      if (list2.length) {
        value += '<br></br>' + list2.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    }

    let result = '';
    if ('db' === ele) {
      result = '<div style="color:red">' + value + '</div>';
    } else {
      result = value;
    }
    return {
      price: 'G.' + ele.toUpperCase(),
      result: result,
    };
  });

  return result;
};

commonUtils.getHeadTailFromResultData = (raw) => {
  if (
    !(raw instanceof Object) ||
    !(raw.all instanceof Array) ||
    !raw.all ||
    !raw.all.length
  ) {
    return [];
  }
  let number = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  raw.all.sort();
  let result = number.map((ele) => {
    let heads = [];
    let tails = [];
    for (let i = 0; i < raw.all.length; i++) {
      let item = raw.all[i];
      if (item[0] === ele) {
        heads.push(item);
      }
      if (item[1] === ele) {
        tails.push(item);
      }
    }

    return {
      head: ele,
      headData: heads.length ? heads.join(',') : '-',
      tailData: tails.length ? tails.join(',') : '-',
      tail: ele,
    };
  });
  return result;
};

commonUtils.randomString = (size) => {
  if (!size) {
    size = 6;
  }

  const charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < size; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
};

commonUtils.getFrequency = (raw, number) => {
  if (!(raw instanceof Array) || raw.length === 0) {
    return [];
  }
  if (!number) {
    number = 2;
  }

  let result = [];
  raw.forEach((ele) => {
    let found = result.filter((f) => f.number === ele);
    if (found.length) {
      found[0].count = found[0].count + 1;
    } else {
      result.push({
        number: ele,
        count: 1,
      });
    }
  });

  result = result
    .filter((ele) => ele.count >= number)
    .map((ele) => ele.number)
    .sort();
  return result;
};
export default commonUtils;
