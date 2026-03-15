import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // 引入我们写的路由大管家
import './index.css'; // 引入包含石绿和山茶红的全局 CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);