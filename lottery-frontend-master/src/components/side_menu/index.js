import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import sideMenuScripts from './scripts';

import classNames from 'classnames';
import Logo from '../../assets/images/logo/logo.png';

const SideMenu = (props) => {
  const [active, setActive] = useState(props.current_active);
  useEffect(() => {
    setActive(props.current_active);
  }, [props.current_active]);

  return (
    <>
      <aside
        className={classNames(
          'main-menu',
          active.base === 'setting' ? 'setting-menu' : '',
        )}
        id='menu'
      >
        <div className='menu-top'>
          <Link
            to={'/'}
            onClick={() => {
              sideMenuScripts.hideMenu();
            }}
          >
            <div className='menu-logo'>
              <img src={Logo} className='logo-svg' alt='logo-svg'></img>
            </div>
          </Link>
          <div
            className='menu-close'
            id='close-btn'
            onClick={() => {
              sideMenuScripts.hideMenu();
            }}
          >
            <span className='material-symbols-outlined'>close</span>
          </div>
        </div>

        {active.base === 'setting' ? (
          <div className='menu-sidebar setting-menu-sidebar'>
            <Link
              to={'/setting/category'}
              className={active.subPath === 'category' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>grid_view</span>
              <h3>Danh mục</h3>
            </Link>
            <Link
              to={'/setting/tag'}
              className={active.subPath === 'tag' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>person</span>
              <h3>Phân loại</h3>
            </Link>
          </div>
        ) : (
          <div className='menu-sidebar main-menu-sidebar'>
            <Link
              to={'/'}
              className={active.base === 'home' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>search</span>
              <h3>Tra cứu</h3>
            </Link>
            <Link
              to={'/check'}
              className={active.base === 'check' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>verified</span>
              <h3>Kiểm tra dữ liệu</h3>
            </Link>
            <Link
              to={'/bacnho'}
              className={active?.base === 'bacnho' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>insights</span>
              <h3>Thống kê bạc nhớ</h3>
            </Link>
            {/* <Link
              to={'/order'}
              className={active.base === 'order' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>order_approve</span>
              <h3>Đơn hàng</h3>
            </Link>
            <Link
              to={'/report'}
              className={active.base === 'report' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>insights</span>
              <h3>Báo cáo</h3>
            </Link>
            <Link
              to={'/message'}
              className={active.base === 'message' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>mail</span>
              <h3>Tin nhắn</h3>
              <span className='message-count'>26</span>
            </Link>
            <Link
              to={'product'}
              className={active.base === 'product' ? 'active' : ''}
              onClick={() => {
                sideMenuScripts.hideMenu();
              }}
            >
              <span className='material-symbols-outlined'>inventory</span>
              <h3>Sản phẩm</h3>
            </Link> */}

            {/* <Link to={'#'}>
              <span className='material-symbols-outlined'>logout</span>
              <h3>Logout</h3>
            </Link> */}
          </div>
        )}
      </aside>
    </>
  );
};

export default SideMenu;
