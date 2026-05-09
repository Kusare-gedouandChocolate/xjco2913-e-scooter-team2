import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { walkInApi } from '../api';

const LAST_CUSTOMER_KEY = 'clerkLastCustomerId';

const phonePattern = /^[0-9+()\-\s]{6,30}$/;
const cardTokenPattern = /^tok_[A-Za-z0-9]{12,64}$/;

export const ClerkCustomerPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cardToken, setCardToken] = useState('tok_WALKIN123456');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<null | { userId: string; phone?: string }>(null);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Customer full name is required.';
    }
    if (!phone.trim()) {
      nextErrors.phone = 'Customer phone number is required.';
    } else if (!phonePattern.test(phone.trim())) {
      nextErrors.phone = 'Phone number format is invalid.';
    }
    if (!cardToken.trim()) {
      nextErrors.cardToken = 'Card token is required.';
    } else if (!cardTokenPattern.test(cardToken.trim())) {
      nextErrors.cardToken = 'Expected format: tok_ followed by 12 to 64 letters or digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const response = await walkInApi.createCustomer({
        fullName: fullName.trim(),
        phone: phone.trim(),
        cardToken: cardToken.trim(),
      });

      window.sessionStorage.setItem(LAST_CUSTOMER_KEY, response.data.userId);
      setSuccess({
        userId: response.data.userId,
        phone: response.data.phone || phone.trim(),
      });
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Unable to create the customer record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Clerk Intake</p>
          <h1 style={styles.title}>Create a walk-in customer and bind a mock card token.</h1>
          <p style={styles.subtitle}>
            Only the minimum required fields are collected so the customer can proceed without
            self-registration.
          </p>
        </div>
        <Link to="/clerk" style={styles.backLink}>Back to desk</Link>
      </section>

      <section style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span>Full Name</span>
            <input
              style={inputStyle(Boolean(errors.fullName))}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Customer full name"
            />
            {errors.fullName && <span style={styles.fieldError}>{errors.fullName}</span>}
          </label>

          <label style={styles.field}>
            <span>Phone Number</span>
            <input
              style={inputStyle(Boolean(errors.phone))}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+61 400 000 000"
            />
            {errors.phone && <span style={styles.fieldError}>{errors.phone}</span>}
          </label>

          <label style={styles.field}>
            <span>Card Token</span>
            <input
              style={inputStyle(Boolean(errors.cardToken))}
              value={cardToken}
              onChange={(event) => setCardToken(event.target.value)}
              placeholder="tok_123456789ABC"
            />
            {errors.cardToken && <span style={styles.fieldError}>{errors.cardToken}</span>}
          </label>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && (
            <div style={styles.successBox}>
              Customer created: {success.userId}. The ID has been cached for the pickup page.
            </div>
          )}

          <div style={styles.actions}>
            <Link to="/clerk/pickup" style={styles.secondaryLink}>Go to pickup</Link>
            <button type="submit" style={styles.primaryButton} disabled={submitting}>
              {submitting ? 'Creating customer...' : 'Create customer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const inputStyle = (invalid: boolean) => ({
  padding: '12px 14px',
  borderRadius: '14px',
  border: `1px solid ${invalid ? '#dc2626' : 'var(--color-border)'}`,
  backgroundColor: '#ffffff',
});

const styles = {
  page: {
    maxWidth: '880px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
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
    fontSize: 'clamp(1.8rem, 3vw, 3rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '640px',
  },
  backLink: {
    padding: '11px 15px',
    borderRadius: '999px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    fontWeight: 700,
  },
  card: {
    padding: '24px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
  },
  form: {
    display: 'grid',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontWeight: 700,
  },
  fieldError: {
    color: '#b91c1c',
    fontSize: '0.88rem',
    fontWeight: 600,
  },
  errorBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#fff7ed',
    color: 'var(--color-accent)',
    fontWeight: 700,
  },
  successBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  secondaryLink: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-main)',
    textDecoration: 'none',
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

export default ClerkCustomerPage;
