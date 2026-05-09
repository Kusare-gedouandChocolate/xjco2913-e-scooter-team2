import React, { useState } from 'react';

import { authApi, type RegisterPayload } from '../api';
import { saveSession } from '../utils/auth';

export const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState<RegisterPayload>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        const res = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        saveSession(res.data.token, res.data.user);
        window.location.href = '/scooters';
      } else {
        const res = await authApi.register(formData);
        saveSession(res.data.token, res.data.user);
        window.location.href = '/scooters';
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Network or server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>E-Scooter</div>
          <h2 style={styles.title}>{isLoginMode ? 'Welcome back' : 'Create a new account'}</h2>
          <p style={styles.subtitle}>
            {isLoginMode
              ? 'Log in to continue your journey.'
              : 'Create an account to start riding.'}
          </p>
          {isLoginMode && (
            <div style={styles.accountTips}>
              <span style={styles.roleHint}>Manager accounts are marked as admin after login.</span>
              <span style={styles.adminTag}>Admin account</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={styles.errorBox}>
            <svg style={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLoginMode && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full name</label>
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="Please provide your real name."
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone number</label>
                <input
                  required
                  name="phone"
                  type="tel"
                  placeholder="Please enter your mobile phone number."
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email address</label>
            <input
              required
              name="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              required
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn(loading)}>
            {loading ? 'Processing...' : isLoginMode ? 'Log in' : 'Register'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {isLoginMode ? 'No account yet?' : 'Already have an account?'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg('');
            }}
            style={styles.switchBtn}
          >
            {isLoginMode ? 'Register' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    padding: '40px 32px',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    fontSize: '2.5rem',
    marginBottom: '16px',
    color: 'var(--color-primary)',
    fontWeight: 800,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--color-text-muted)',
  },
  accountTips: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  roleHint: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
  adminTag: {
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#fff1f2',
    color: 'var(--color-accent)',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    color: 'var(--color-accent)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  errorIcon: {
    width: '20px',
    height: '20px',
    marginRight: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: (loading: boolean) => ({
    marginTop: '12px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: loading ? '#94d8d7' : 'var(--color-primary)',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 4px 6px -1px rgba(87, 194, 192, 0.3)',
  }),
  footer: {
    marginTop: '32px',
    textAlign: 'center' as const,
    fontSize: '0.9rem',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: 600,
    marginLeft: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};

export default AuthPage;
