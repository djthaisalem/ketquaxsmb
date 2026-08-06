import { DateTimeFormat } from '../../../constants/DateConstants';

const categoryScripts = {};

categoryScripts.fields = [
  {
    label: 'Danh mục',
    type: 'text',
    placeHolder: 'Tối đa 256 kí tự',
    required: true,
    length: 256,
    name: 'name',
  },
  {
    label: 'Mô tả',
    type: 'multi-text',
    placeHolder: 'Nhập giá trị',
    length: 0,
    required: true,
    name: 'description',
  },
];

categoryScripts.childField = {
  label: 'Tên cấp 2',
  type: 'text',
  placeHolder: 'Tối đa 256 kí tự',
  required: true,
  length: 256,
  name: 'children1',
};

categoryScripts.displayConfig = [
  {
    field_code: 'name',
    title: 'Danh mục',
    highlight: 'primary',
    size: 'large',
  },
  {
    field_code: 'description',
    title: 'Mô tả',
    size: 'large',
    hideFrom: 'small',
  },
  {
    field_code: 'created_date',
    title: 'Ngày tạo',
    size: 'medium',
    hideFrom: 'medium',
    dateFormat: DateTimeFormat.DATE_TIME,
  },
];

categoryScripts.convertToListFormat = (data) => {
  if (!data || !data.length) {
    return [];
  }
  return data
    .filter((f) => !!f && f._id)
    .map((ele) => {
      let item = [];
      for (const field of categoryScripts.displayConfig) {
        let newField = { ...field };
        newField.type = 'inline';
        if (ele[field.field_code]) {
          newField.data = ele[field.field_code];
        }
        item.push(newField);
      }
      return item;
    });
};

categoryScripts.handleAfterCreate = (data) => {
  if (data && data.status_code === 9999 && data.payload) {
    const payload = JSON.parse(data.payload);
    return categoryScripts.convertToListFormat([payload]);
  }
  return [];
};

export default categoryScripts;
