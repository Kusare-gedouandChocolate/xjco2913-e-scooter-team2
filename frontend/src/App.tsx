import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { BookingPage } from './pages/BookingPage';
import { ClerkPage } from './pages/ClerkPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { PickupVerificationPage } from './pages/PickupVerificationPage';
import { ReportPage } from './pages/ReportPage';
import { ScooterPage } from './pages/ScooterPage';
import {
  clearSession,
  getAuthUser,
  hasClerkRole,
  hasManagerRole,
  isAuthenticated,
  isClerk,
  isManager,
} from './utils/auth';

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

const ClerkRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isClerk()) {
    return <Navigate to="/scooters" replace />;
  }
  return <>{children}</>;
};

const Navbar = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  if (!isAuthenticated()) {
    return null;
  }

  const manager = hasManagerRole(user?.role);
  const clerk = hasClerkRole(user?.role);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navShell}>
        <button style={styles.brand} onClick={() => navigate('/scooters')}>
          <span style={styles.brandMark}>RideFlow</span>
          <span style={styles.brandSub}>e-scooter sprint3</span>
          {manager && <span style={styles.managerBadge}>Admin</span>}
          {clerk && <span style={styles.clerkBadge}>Clerk</span>}
        </button>

        <div style={styles.links}>
          <Link style={styles.link} to="/scooters">Fleet</Link>
          <Link style={styles.link} to="/bookings">Bookings</Link>
          <Link style={styles.link} to="/feedback">Feedback</Link>
          {clerk && <Link style={styles.link} to="/clerk">Desk</Link>}
          {clerk && <Link style={styles.link} to="/pickup-verification">Pickup Verify</Link>}
          {manager && <Link style={styles.link} to="/reports">Reports</Link>}
          {manager && <Link style={styles.link} to="/admin">Admin</Link>}
          <button
            style={styles.logout}
            onClick={() => {
              clearSession();
              navigate('/login');
            }}
          >
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
      <main style={styles.main}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/scooters" replace />} />
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
            path="/clerk"
            element={
              <ClerkRoute>
                <ClerkPage />
              </ClerkRoute>
            }
          />
          <Route
            path="/pickup-verification"
            element={
              <ClerkRoute>
                <PickupVerificationPage />
              </ClerkRoute>
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
          <Route
            path="*"
            element={
              <div style={styles.notFound}>
                <h2>Page not found</h2>
                <Link to="/scooters" style={styles.backLink}>Return to fleet</Link>
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
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    padding: '18px 20px 0',
  },
  navShell: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: '22px',
    background: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(14px)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(255, 255, 255, 0.65)',
    flexWrap: 'wrap' as const,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'transparent',
    flexWrap: 'wrap' as const,
  },
  brandMark: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  brandSub: {
    color: 'var(--color-text-muted)',
    fontSize: '0.86rem',
  },
  managerBadge: {
    padding: '5px 10px',
    borderRadius: '999px',
    backgroundColor: '#fff7ed',
    color: 'var(--color-accent)',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  clerkBadge: {
    padding: '5px 10px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-primary-soft)',
    color: 'var(--color-primary)',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap' as const,
  },
  link: {
    textDecoration: 'none',
    color: 'var(--color-text-main)',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  logout: {
    padding: '10px 16px',
    borderRadius: '999px',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    fontWeight: 700,
  },
  main: {
    minHeight: 'calc(100vh - 96px)',
    padding: '20px',
  },
  notFound: {
    maxWidth: '680px',
    margin: '80px auto',
    padding: '48px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-md)',
    textAlign: 'center' as const,
  },
  backLink: {
    display: 'inline-block',
    marginTop: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};
