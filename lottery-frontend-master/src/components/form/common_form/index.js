import React, { useState } from 'react';
import commonUtils from '../../../utils/commonUtils';
import './index.css';

import PrimaryButton from '../../button/primary_button';
import MultiTextInput from '../../input/multi_text_input';
import PrimaryInput from '../../input/primary_input';
import SingleSelect from '../../input/single_select';

const CommonForm = (props) => {
  const [errors, setErrors] = useState();

  const handleSubmit = (e) => {
    e.preventDefault();

    // validate data
    let fields = [...props.fields];
    const data = {};
    for (const field of fields) {
      data[field.name] = e.target.elements[field.name]?.value;
    }
    const err = commonUtils.validateForm(fields, data);
    if (err.length) {
      setErrors(err);
      return;
    }

    props.handleSubmit(data);
  };

  return (
    <>
      <form
        className='common-form'
        id={'commong-form-' + props.id}
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className='common-form-input-zone'>
          {props.fields?.map((ele) => {
            switch (ele.type) {
              case 'text':
              case 'number':
                return (
                  <PrimaryInput
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
        </div>

        <button className='common-form-submit' type='submit'>
          <PrimaryButton
            text={props.submitText ? props.submitText : 'click'}
            onclick={() => {}}
          />
        </button>
      </form>
    </>
  );
};

export default CommonForm;
