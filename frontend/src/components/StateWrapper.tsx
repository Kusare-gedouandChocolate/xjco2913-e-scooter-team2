import React, { type ReactNode } from 'react';

interface StateWrapperProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export const StateWrapper: React.FC<StateWrapperProps> = ({
  loading,
  error,
  empty,
  emptyMessage = 'No data available.',
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <div style={styles.container} role="status" aria-live="polite" aria-busy="true">
        <svg
          style={styles.spinner}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            style={{ opacity: 0.25 }}
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p style={styles.messageText}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container} role="alert" aria-live="assertive">
        <div style={styles.errorIcon} aria-hidden="true">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 style={styles.errorTitle}>Loading failed</h3>
        <p style={styles.errorMessage}>{error}</p>
        {onRetry && (
          <button type="button" style={styles.retryBtn} onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div style={styles.container} role="status" aria-live="polite">
        <div style={styles.emptyBox} aria-hidden="true">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p style={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '260px',
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    margin: '16px 0',
    gap: '12px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    color: 'var(--color-primary)',
    animation: 'spin 1s linear infinite',
  },
  messageText: {
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    color: 'var(--color-accent)',
  },
  errorTitle: {
    color: 'var(--color-accent)',
  },
  errorMessage: {
    color: 'var(--color-text-muted)',
    maxWidth: '360px',
  },
  emptyBox: {
    width: '64px',
    height: '64px',
    color: '#94a3b8',
  },
  emptyMessage: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
  },
  retryBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
  },
};

const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('state-wrapper-spin-style')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'state-wrapper-spin-style';
  styleSheet.innerText = spinKeyframes;
  document.head.appendChild(styleSheet);
}
