import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import { AuthPage } from './pages/AuthPage';
import { ScooterPage } from './pages/ScooterPage';
import { BookingPage } from './pages/BookingPage';
import { ReportPage } from './pages/ReportPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AdminPage } from './pages/AdminPage';
import { clearSession, getAuthUser, hasManagerRole, isAuthenticated, isManager } from './utils/auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isManager()) {
    return <Navigate to="/scooters" replace />;
  }
  return <>{children}</>;
};

const Navbar = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  if (!isAuthenticated()) return null;

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const manager = hasManagerRole(user?.role);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.brand} onClick={() => navigate('/scooters')}>
          <span style={styles.logoIcon}>Scooter</span>
          <span style={styles.brandName}>E-Scooter</span>
          {manager && <span style={styles.managerBadge}>Admin</span>}
        </div>

        <div style={styles.navLinks}>
          <Link to="/scooters" style={styles.link}>Nearby vehicles</Link>
          <Link to="/bookings" style={styles.link}>My journey</Link>
          <Link to="/feedback" style={styles.link}>Customer feedback</Link>
          {manager && <Link to="/reports" style={styles.link}>Reports</Link>}
          {manager && <Link to="/admin" style={styles.link}>System config</Link>}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={styles.mainContent}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          <Route
            path="/scooters"
            element={
              <ProtectedRoute>
                <ScooterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ManagerRoute>
                <ReportPage />
              </ManagerRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ManagerRoute>
                <AdminPage />
              </ManagerRoute>
            }
          />

          <Route path="/" element={<Navigate to="/scooters" replace />} />

          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-text-muted)' }}>
                <h2>404 - Page not found</h2>
                <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Back to home</Link>
              </div>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;

const styles = {
  navbar: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    minHeight: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    flexWrap: 'wrap' as const,
  },
  logoIcon: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
    letterSpacing: '-0.5px',
  },
  managerBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#fff1f2',
    color: 'var(--color-accent)',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-end',
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
    minHeight: 'calc(100vh - 64px)',
  },
};
