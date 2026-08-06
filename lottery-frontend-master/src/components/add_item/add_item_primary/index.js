import classNames from 'classnames';
import React, { useState } from 'react';
import './index.css';

const AddItemPrimary = (props) => {
  const [mode, setMode] = useState(true); // true => add | false => remove

  return (
    <>
      <div
        className={classNames('add-item', !mode ? 'remove-mode' : '')}
        onClick={() => {
          mode ? props.addItemAction() : props.removeItemAction();
          setMode(!mode);
        }}
      >
        {mode ? (
          <span className='material-symbols-sharp'>add</span>
        ) : (
          <span className='material-symbols-outlined'>remove</span>
        )}
      </div>
    </>
  );
};

export default AddItemPrimary;
