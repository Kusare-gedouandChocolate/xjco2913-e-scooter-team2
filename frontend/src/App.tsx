// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

// 引入我们刚才写好的三个核心页面 [cite: 203-207]
import { AuthPage } from './pages/AuthPage';
import { ScooterPage } from './pages/ScooterPage';
import { BookingPage } from './pages/BookingPage';

// --- 简单的路由守卫组件 ---
// 作用：如果没有 Token，就拦截并重定向到登录页
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// --- 全局导航栏组件 ---
// 作用：提供页面间的跳转，并展示石绿色的品牌视觉
const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // 如果未登录，不展示导航栏（因为全屏展示 AuthPage 的卡片更好看）
  if (!isAuthenticated) return null;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* 品牌 Logo */}
        <div style={styles.brand} onClick={() => navigate('/scooters')}>
          <span style={styles.logoIcon}>🛴</span>
          <span style={styles.brandName}>E-Scooter</span>
        </div>

        {/* 导航链接 */}
        <div style={styles.navLinks}>
          <Link to="/scooters" style={styles.link}>附近车辆</Link>
          <Link to="/bookings" style={styles.link}>我的行程</Link>
          {/* 退出按钮：带有悬浮交互的石绿按钮 */}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- 根组件 ---
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* 导航栏挂载在路由内部，以便使用 useNavigate 和 Link */}
      <Navbar />
      
      {/* 核心内容区 */}
      <main style={styles.mainContent}>
        <Routes>
          {/* 公开路由：注册/登录 */}
          <Route path="/login" element={<AuthPage />} />

          {/* 受保护路由：车辆浏览与预订 */}
          <Route 
            path="/scooters" 
            element={
              <ProtectedRoute>
                <ScooterPage />
              </ProtectedRoute>
            } 
          />

          {/* 受保护路由：预订记录 */}
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            } 
          />

          {/* 默认重定向：访问根目录时，自动去车辆页（守卫会判断是否需要去登录） */}
          <Route path="/" element={<Navigate to="/scooters" replace />} />
          
          {/* 404 处理 */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-text-muted)' }}>
              <h2>404 - 页面未找到</h2>
              <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>返回首页</Link>
            </div>
          } />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;

// --- 内联样式字典 ---
const styles = {
  navbar: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 100, // 确保导航栏在最上层
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--color-primary)', // 石绿品牌色
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  link: {
    textDecoration: 'none',
    color: 'var(--color-text-main)',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'color 0.2s',
  },
  logoutBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#f1f5f9',
    color: 'var(--color-text-main)',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  mainContent: {
    minHeight: 'calc(100vh - 64px)', // 减去导航栏高度
  }
};
