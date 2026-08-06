import React from 'react';
import ReactLoading from 'react-loading';
import './index.css';

const PrimaryButton = (props) => {
  return (
    <>
      <div className='primary-button' onClick={() => props.onclick()}>
        <span
          style={{ fontSize: (props.fontSize ? props.fontSize : 1) + 'rem' }}
        >
          {props.text}
        </span>
        {props.isLoading ? (
          <div className='pb-loading'>
            <ReactLoading type='spin' height={16} width={16} color='white' />
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default PrimaryButton;
