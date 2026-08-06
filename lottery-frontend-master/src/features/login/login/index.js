import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import loginScript from './scripts';

import Logo from '../../../assets/images/logo/logo.png';
import CommonForm from '../../../components/form/common_form';

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const result = await loginScript.handleLogin(data);
    if (result) {
      navigate('/');
    }
  };

  return (
    <>
      <main className='login'>
        <div className='login-container'>
          <div className='login-logo'>
            <img src={Logo} className='logo-svg' alt='logo-svg'></img>
          </div>
          <h1>Đăng nhập</h1>
          <div className='login-form'>
            <CommonForm
              id='login'
              fields={loginScript.fields}
              submitText={'Đăng nhập'}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Login;
