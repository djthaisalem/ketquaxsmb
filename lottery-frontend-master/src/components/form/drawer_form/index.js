import React, { useEffect, useState } from 'react';
import commonUtils from '../../../utils/commonUtils';
import './index.css';
import drawerScripts from './scripts';

import classNames from 'classnames';
import PrimaryButton from '../../button/primary_button';
import MultiTextInput from '../../input/multi_text_input';
import PrimaryInput from '../../input/primary_input';
import RoundSwitch from '../../input/round_switch';
import SingleSelect from '../../input/single_select';

const FormDrawer = (props) => {
  const [errors, setErrors] = useState();
  const [showChild, setShowChild] = useState(false);
  const [childFields, setChildFields] = useState([]);
  const [addStatus, setAddStatus] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showChild) {
      setChildFields([{ ...props.childField }]);
    } else {
      setChildFields([]);
    }
  }, [showChild]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAddStatus(undefined);
    // validate data
    let fields = [...props.fields];
    if (childFields.length) {
      fields.push(...childFields);
    }

    const data = {};
    for (const field of fields) {
      data[field.name] = e.target.elements[field.name]?.value;
    }
    if (data.date && data.date.length == 10) {
      let split = data.date.split('-');
      data.date = split[2] + '/' + split[1] + '/' + split[0];
    }
    const err = commonUtils.validateForm(fields, data);
    if (err.length) {
      setErrors(err);
      setAddStatus();
      setIsLoading(false);
      return;
    }
    const response = await props.handleSubmit(data);
    if (response != undefined) {
      setAddStatus(true);
      setErrors([]);
    } else {
      setAddStatus(false);
    }
    setIsLoading(false);
  };

  const addChildItem = () => {
    const newItem = { ...props.childField };

    if (!childFields.length) {
      setChildFields([newItem]);
    } else {
      let last_child_field = childFields[childFields.length - 1]?.name;
      if (last_child_field) {
        last_child_field = last_child_field.replace('children', '');
        let number = parseInt(last_child_field) + 1;
        newItem.name = 'children' + number;
        setChildFields([...childFields, newItem]);
      }
    }
  };

  const removeChildItem = (field) => {
    if (childFields.length)
      setChildFields(childFields.filter((f) => f.name !== field));
  };

  return (
    <>
      <div
        className='drawer'
        id={'drawer-' + props.id}
        onClick={() => drawerScripts.hide(props.id)}
      ></div>
      <form
        className='drawer-form'
        id={'drawer-form-' + props.id}
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className='drawer-form-header'>
          <span
            onClick={() => drawerScripts.hide(props.id)}
            className='material-symbols-outlined'
            id={'drawer-close-button'}
          >
            close
          </span>

          <h3>Thêm mới</h3>
        </div>

        <div className='drawer-input-zone'>
          {props.fields?.map((ele) => {
            switch (ele.type) {
              case 'text':
              case 'date':
              case 'number':
                return (
                  <PrimaryInput
                    key={ele.name + commonUtils.randomString(6)}
                    data={ele}
                    showAddIcon={false}
                    labelBefore={true}
                    width={ele.type === 'date' ? '145px' : '80px'}
                    labelWidth={'75px'}
                  />
                );
              case 'single-select':
                return (
                  <SingleSelect
                    key={ele.name}
                    data={ele}
                    err={
                      errors &&
                      errors.filter((f) => f.field === ele.name).length
                        ? errors.filter((f) => f.field === ele.name)[0]
                        : null
                    }
                  />
                );
              case 'multi-text':
                return (
                  <MultiTextInput
                    key={ele.name}
                    data={ele}
                    err={
                      errors &&
                      errors.filter((f) => f.field === ele.name).length
                        ? errors.filter((f) => f.field === ele.name)[0]
                        : null
                    }
                  />
                );
              default:
                return <></>;
            }
          })}

          {props.haveChild ? (
            <div className='drawer-children'>
              <RoundSwitch
                title={'Phân cấp'}
                onclick={() => setShowChild(!showChild)}
                check={showChild}
              />

              <div
                className={classNames(
                  'drawer-child-input-zone',
                  childFields.length >= 3
                    ? 'drawer-child-input-zone-scroll'
                    : '',
                )}
              >
                {showChild ? (
                  childFields.map((ele) => (
                    <PrimaryInput
                      key={ele.name}
                      data={ele}
                      err={
                        errors &&
                        errors.filter((f) => f.field === ele.name).length
                          ? errors.filter((f) => f.field === ele.name)[0]
                          : null
                      }
                      showAddIcon={true}
                      addItemAction={() => addChildItem()}
                      removeItemAction={() => removeChildItem(ele.name)}
                    />
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>

        <button className='drawer-submit' type='submit'>
          <PrimaryButton
            text={'Thêm'}
            onclick={() => {}}
            isLoading={isLoading}
          />
          {errors && errors.length ? <h3>Số liệu không hợp lệ</h3> : <></>}
          {addStatus != undefined ? (
            addStatus ? (
              <h3>Thêm thành công</h3>
            ) : (
              <h3>Thêm thất bại</h3>
            )
          ) : (
            <></>
          )}
        </button>
      </form>
    </>
  );
};

export default FormDrawer;
