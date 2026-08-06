import React, { useEffect, useState } from 'react';
import './index.css';

const RoundSwitch = (props) => {
  const [checked, setChecked] = useState(props.check);

  useEffect(() => {
    setChecked(props.check);
  }, [props.check]);

  return (
    <div className='switch-container'>
      <label className='switch'>
        <input
          type='checkbox'
          checked={checked ? true : false}
          onClick={() => {
            props.onclick();
          }}
          onChange={() => {}}
        ></input>
        <span className='slider round'></span>
      </label>
      <label className='round-switch-title'>{props.title}</label>
    </div>
  );
};

export default RoundSwitch;
