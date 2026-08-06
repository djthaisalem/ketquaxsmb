import React, { useState } from 'react';
import './index.css';

import classNames from 'classnames';
import Select from 'react-select';

const SingleSelect = (props) => {
  const [active, setActive] = useState(false);
  return (
    <div className='input-container'>
      <label>
        {props.data.label} {props.data.require ? <p> *</p> : ''}
      </label>
      <div
        className={classNames(
          'input single-selection-input',
          active ? 'input-active single-select-input-active' : '',
        )}
        style={props.width ? { width: props.width } : {}}
      >
        <Select
          className='single-select'
          classNamePrefix='select'
          name={props.data?.name ? props.data.name : 'name'}
          defaultValue={
            props.defaultValue ? props.defaultValue : props.options[0]
          }
          options={props.options}
          onMenuOpen={() => setActive(true)}
          onMenuClose={() => setActive(false)}
          isSearchable={true}
          onChange={(e) => {
            if (props.onChange) {
              props.onChange(e.value);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SingleSelect;
