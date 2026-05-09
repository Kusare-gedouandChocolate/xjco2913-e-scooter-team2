import React, { useState } from 'react';

import { bookingsApi } from '../api';
import { getAuthUser } from '../utils/auth';

export const PickupVerificationPage: React.FC = () => {
  const user = getAuthUser();
  const [bookingId, setBookingId] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    if (!bookingId.trim() || !pickupCode.trim()) {
      setStatus('error');
      setMessage('Booking id and pickup code are required.');
      return;
    }

    setStatus('idle');
    setMessage('');

    try {
      const response = await bookingsApi.verifyPickup(bookingId.trim(), {
        pickupCode: pickupCode.trim(),
        verifiedBy: user?.userId || user?.email,
      });
      setStatus('success');
      setMessage(`Pickup verified. Order status is now ${response.data.status}.`);
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      setStatus('error');
      setMessage(
        apiError.message ||
          apiError.code ||
          'Verification failed. The code may be invalid, expired, or already used.',
      );
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>Remote to store</p>
        <h1 style={styles.title}>Pickup code verification for in-store handover.</h1>
        <p style={styles.subtitle}>
          Use this clerk-only page to complete the remote booking to store pickup flow,
          with clear success and failure feedback for expired, invalid, or already used codes.
        </p>
      </section>

      <section style={styles.card}>
        <div style={styles.stepRow}>
          <Step title="1. Enter booking" active />
          <Step title="2. Validate code" active />
          <Step title="3. Hand over scooter" active={status === 'success'} />
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span>Booking id</span>
            <input style={styles.input} value={bookingId} onChange={(event) => setBookingId(event.target.value)} />
          </label>

          <label style={styles.field}>
            <span>Pickup code</span>
            <input style={styles.input} value={pickupCode} onChange={(event) => setPickupCode(event.target.value)} />
          </label>
        </div>

        {message && (
          <div style={status === 'success' ? styles.successBox : styles.errorBox}>
            {message}
          </div>
        )}

        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={() => {
            setBookingId('');
            setPickupCode('');
            setStatus('idle');
            setMessage('');
          }}>
            Reset
          </button>
          <button style={styles.primaryButton} onClick={handleVerify}>
            Verify pickup
          </button>
        </div>
      </section>
    </div>
  );
};

const Step = ({ title, active }: { title: string; active?: boolean }) => (
  <div style={active ? styles.stepActive : styles.step}>
    <strong>{title}</strong>
  </div>
);

const styles = {
  page: {
    maxWidth: '980px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  hero: {
    paddingTop: '8px',
  },
  kicker: {
    color: 'var(--color-accent)',
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: '10px',
  },
  title: {
    fontSize: 'clamp(2rem, 3vw, 3.2rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '760px',
  },
  card: {
    padding: '24px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  stepRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  step: {
    padding: '14px',
    borderRadius: '18px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-muted)',
  },
  stepActive: {
    padding: '14px',
    borderRadius: '18px',
    backgroundColor: 'var(--color-primary-soft)',
    color: 'var(--color-primary)',
  },
  formGrid: {
    display: 'grid',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontWeight: 700,
  },
  input: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#ffffff',
  },
  successBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  errorBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#fff7ed',
    color: 'var(--color-accent)',
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  secondaryButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#eef2f7',
    fontWeight: 700,
  },
  primaryButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
};
