import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import AddItemPrimary from '../../add_item/add_item_primary';
import './index.css';

const PrimaryInput = (props) => {
  const [active, setActive] = useState(false);
  const [err, setErr] = useState(props.err);
  const ref = useRef();

  useEffect(() => {
    setErr(props.err);
  }, [props.err]);

  return (
    <div className='input-container'>
      {props.labelBefore ? (
        err ? (
          <label className='error-label label-before'>{err.message}</label>
        ) : (
          <label
            className={'label-before'}
            style={props.labelWidth ? { width: props.labelWidth } : {}}
          >
            {props.data.label} {props.data.require ? <p> *</p> : ''}
          </label>
        )
      ) : (
        <div></div>
      )}
      <div
        className={classNames(
          'input primary-input',
          err ? 'primary-input-error' : '',
          active && !err ? 'input-active' : '',
          active && err ? 'input-active-error' : '',
        )}
        style={props.width ? { width: props.width } : {}}
      >
        <input
          type={props.data.type ? props.data.type : 'text'}
          name={props.data.name ? props.data.name : 'name'}
          placeholder={props.data.placeHolder}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          autoComplete='off'
          ref={ref}
          onChange={(e) => {
            setErr(undefined);
            if (props.onChange) {
              props.onChange(
                props.data.customValue
                  ? props.data.customValue
                  : e.target.value,
              );
            }
          }}
          defaultValue={props.defaultValue}
          value={props.value}
          checked={props.checked}
          readOnly={props.readOnly}
        />
      </div>
      {props.labelAfter ? (
        err ? (
          <label className='error-label label-after'>{err.message}</label>
        ) : (
          <label
            className={'label-after'}
            style={props.labelWidth ? { width: props.labelWidth } : {}}
          >
            {props.data.label} {props.data.require ? <p> *</p> : ''}
          </label>
        )
      ) : (
        <div></div>
      )}
      {props.showAddIcon ? (
        <AddItemPrimary
          addItemAction={() => props.addItemAction()}
          removeItemAction={() => props.removeItemAction()}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default PrimaryInput;
