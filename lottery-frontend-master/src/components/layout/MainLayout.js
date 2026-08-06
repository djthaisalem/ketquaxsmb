import React, { useEffect } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';

import classNames from 'classnames';
import { LOCAL_STORAGE_CONSTANTS } from '../../constants/localStorageConstants';
import Header from '../header';
import SideMenu from '../side_menu';
import mainLayoutScripts from './scripts';

const MainLayout = (props) => {
  // check active route
  const current_active = mainLayoutScripts.getCurrentModule(
    useMatch('/'),
    useMatch('/bacnho/*'),
    useMatch('/check/*'),
  );

  // check login
  const navigate = useNavigate();
  useEffect(() => {
    let token = localStorage.getItem(LOCAL_STORAGE_CONSTANTS.TOKEN);
    // if (!token) {
    //   navigate('/login');
    // }
  }, [navigate]);

  return (
    <>
      <Header />

      <div
        className={classNames(
          current_active.base === 'setting' ? 'setting-container' : '',
          'container main-layout',
        )}
      >
        <SideMenu current_active={current_active} />

        {props.notFound ? props.notFound : <Outlet />}
      </div>
    </>
  );
};

export default MainLayout;
