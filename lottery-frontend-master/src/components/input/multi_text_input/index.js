import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const MultiTextInput = (props) => {
  const [active, setActive] = useState(false);
  const [err, setErr] = useState(props.err);

  const ref = useRef();

  useEffect(() => {
    setErr(props.err);
  }, [props.err]);

  useEffect(() => {
    ref.current?.focus();
  }, [props.focus]);

  return (
    <div className='input-container'>
      <div
        className={classNames(
          'input multi-text-input',
          err ? 'multi-text-input-error' : '',
          active && !err ? 'input-active' : '',
          active && err ? 'input-active-error' : '',
        )}
      >
        <textarea
          type={props.data.type ? props.data.type : 'text'}
          name={props.data.name ? props.data.name : 'name'}
          placeholder={
            props.data.placeholder ? props.data.placeholder : 'Nhập giá trị'
          }
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          autoComplete='off'
          onChange={() => setErr(undefined)}
          ref={ref}
        />

        {err ? (
          <label className='error-label'>{err.message}</label>
        ) : (
          <label>
            {props.data.label} {props.data.require ? <p> *</p> : ''}
          </label>
        )}
      </div>
    </div>
  );
};

export default MultiTextInput;
