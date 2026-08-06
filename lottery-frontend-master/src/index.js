import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AdminApp from './AdminApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />);
