import React, { useEffect, useState } from 'react';
import sideMenuScripts from '../side_menu/scripts';
import './index.css';
import headerScripts from './scripts';

import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo/logo.png';
import ImageUser from '../../assets/images/user.png';

const SideMenu = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if ('light' === theme) {
      document.body.classList.remove('dark-theme-variables');
    } else {
      document.body.classList.add('dark-theme-variables');
    }

    return () => {
      document.body.classList.remove('dark-theme-variables');
    };
  }, [theme]);

  return (
    <div className='container header'>
      <div className='header-left'>
        <Link to={'/'}>
          <div className='logo'>
            <img src={Logo} className='logo-svg' alt='logo-svg'></img>
          </div>
        </Link>
      </div>

      <div className='header-right'>
        {/* <Link className='setting-button' to={'setting/category'}>
          <span className='material-symbols-outlined'>settings</span>
        </Link> */}

        <button id='menu-btn' onClick={() => sideMenuScripts.showMenu()}>
          <span className='material-symbols-sharp'>menu</span>
        </button>
        {/* <div className='theme-toggler'>
          <span
            className={classNames(
              'material-symbols-sharp',
              theme === 'light' ? 'active' : '',
            )}
            onClick={() => setTheme('light')}
          >
            light_mode
          </span>
          <span
            className={classNames(
              'material-symbols-sharp',
              theme === 'dark' ? 'active' : '',
            )}
            onClick={() => setTheme('dark')}
          >
            dark_mode
          </span>
        </div> */}
        <div
          className='profile-photo'
          onClick={() => headerScripts.showProfilePanel()}
        >
          <img src={ImageUser} alt='user'></img>
        </div>

        <div className='profile-panel' id='profile-panel'>
          <div className='profile-panel-top'>
            <div
              className='profile-panel-close'
              id='profile-panel-close'
              onClick={() => headerScripts.hideProfilePanel()}
            >
              <span className='material-symbols-outlined'>close</span>
            </div>
            <div className='info'>
              <p>
                Hi, <b>William</b>
              </p>
              <small className='text-muted'>Admin</small>
            </div>
            <div className='profile-panel-blank'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
