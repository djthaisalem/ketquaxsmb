import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AdminApp from './AdminApp';
import { applySeo } from './seo';

const root = ReactDOM.createRoot(document.getElementById('root'));
applySeo();
root.render(window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />);
