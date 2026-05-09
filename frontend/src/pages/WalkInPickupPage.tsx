import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { scootersApi, walkInApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { PricingRule, Scooter } from '../types';
import { formatPrice, getUTCTimeString } from '../utils/format';

const LAST_CUSTOMER_KEY = 'clerkLastCustomerId';
const LAST_BOOKING_KEY = 'clerkLastBookingId';

export const WalkInPickupPage: React.FC = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [selectedScooterId, setSelectedScooterId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | {
    bookingId: string;
    bookingStatus: string;
    confirmationNumber?: string;
    totalCost?: string;
  }>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [scooterRes, pricingRes] = await Promise.all([
        scootersApi.getScooters(),
        scootersApi.getPricingRules(),
      ]);

      const availableScooters = (scooterRes.data || []).filter(
        (item) => String(item.status).toLowerCase() === 'available',
      );

      setScooters(availableScooters);
      setRules(pricingRes.data || []);
      setSelectedScooterId((current) => current || String(availableScooters[0]?.scooterId || ''));
      setSelectedRuleId((current) => current || String(pricingRes.data?.[0]?.ruleId || ''));
      setCustomerId((current) => current || window.sessionStorage.getItem(LAST_CUSTOMER_KEY) || '');
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load pickup options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!customerId.trim()) {
      nextErrors.customerId = 'Customer ID is required.';
    }
    if (!selectedScooterId) {
      nextErrors.scooterId = 'Select a scooter.';
    }
    if (!selectedRuleId) {
      nextErrors.ruleId = 'Select a rental option.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const selectedScooter = scooters.find((item) => String(item.scooterId) === selectedScooterId) || null;
  const selectedRule = rules.find((item) => String(item.ruleId) === selectedRuleId) || null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSuccess(null);

    try {
      const response = await walkInApi.pickup({
        customerId: customerId.trim(),
        scooterId: Number(selectedScooterId),
        rentalOptionId: Number(selectedRuleId),
        startTime: getUTCTimeString(),
        paymentMethod: 'CREDIT_CARD',
        simulateSuccess: true,
      });

      window.sessionStorage.setItem(LAST_BOOKING_KEY, response.data.bookingId);
      setSuccess({
        bookingId: response.data.bookingId,
        bookingStatus: response.data.bookingStatus,
        confirmationNumber: response.data.confirmationNumber,
        totalCost: response.data.totalCost,
      });
    } catch (err) {
      const apiError = err as { message?: string };
      setSubmitError(apiError.message || 'Unable to create the walk-in pickup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero} className="responsive-hero">
        <div>
          <p style={styles.kicker}>Walk-In Pickup</p>
          <h1 style={styles.title}>Create an in-store rental for a clerk-created customer.</h1>
          <p style={styles.subtitle}>
            The page reuses the cached customer ID from intake, shows only available scooters,
            and returns the booking confirmation for the desk operator.
          </p>
        </div>
        <div style={styles.heroLinks} className="responsive-links">
          <Link to="/clerk" style={styles.secondaryLink}>Back to desk</Link>
          <Link to="/clerk/customers" style={styles.secondaryLink}>Create customer first</Link>
        </div>
      </section>

      <StateWrapper loading={loading} error={error} onRetry={fetchData}>
        <section style={styles.card} className="responsive-page-card">
          <form onSubmit={handleSubmit} style={styles.form} aria-busy={submitting}>
            <label style={styles.field} htmlFor="walkin-customer-id">
              <span>Customer ID</span>
              <input
                id="walkin-customer-id"
                style={inputStyle(Boolean(fieldErrors.customerId))}
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                placeholder="UUID from the intake step"
                autoComplete="off"
              />
              {fieldErrors.customerId && <span style={styles.fieldError}>{fieldErrors.customerId}</span>}
            </label>

            <label style={styles.field} htmlFor="walkin-scooter">
              <span>Scooter</span>
              <select
                id="walkin-scooter"
                style={inputStyle(Boolean(fieldErrors.scooterId))}
                value={selectedScooterId}
                onChange={(event) => setSelectedScooterId(event.target.value)}
              >
                <option value="">Select a scooter</option>
                {scooters.map((scooter) => (
                  <option key={scooter.scooterId} value={String(scooter.scooterId)}>
                    {scooter.model || scooter.code} · {scooter.location}
                  </option>
                ))}
              </select>
              {fieldErrors.scooterId && <span style={styles.fieldError}>{fieldErrors.scooterId}</span>}
            </label>

            <label style={styles.field} htmlFor="walkin-rule">
              <span>Rental Option</span>
              <select
                id="walkin-rule"
                style={inputStyle(Boolean(fieldErrors.ruleId))}
                value={selectedRuleId}
                onChange={(event) => setSelectedRuleId(event.target.value)}
              >
                <option value="">Select a rental option</option>
                {rules.map((rule) => (
                  <option key={rule.ruleId} value={String(rule.ruleId)}>
                    {rule.hireType} · {formatPrice(rule.price)}
                  </option>
                ))}
              </select>
              {fieldErrors.ruleId && <span style={styles.fieldError}>{fieldErrors.ruleId}</span>}
            </label>

            {selectedScooter && selectedRule && (
              <div style={styles.summaryCard} role="status" aria-live="polite">
                <div style={styles.summaryRow}>
                  <span>Vehicle</span>
                  <strong>{selectedScooter.model || selectedScooter.code}</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Battery</span>
                  <strong>{selectedScooter.batteryLevel ?? '--'}%</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Package</span>
                  <strong>{selectedRule.hireType}</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Charge Preview</span>
                  <strong>{formatPrice(selectedRule.price)}</strong>
                </div>
              </div>
            )}

            {submitError && <div style={styles.errorBox} role="alert">{submitError}</div>}
            {success && (
              <div style={styles.successBox} role="status" aria-live="polite">
                Booking {success.bookingId} created with status {success.bookingStatus}
                {success.confirmationNumber ? ` and confirmation ${success.confirmationNumber}` : ''}.
              </div>
            )}

            <div style={styles.actions} className="responsive-actions">
              <Link to="/clerk/return" style={styles.secondaryLink}>Go to return</Link>
              <button type="submit" style={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Creating pickup...' : 'Confirm walk-in pickup'}
              </button>
            </div>
          </form>
        </section>
      </StateWrapper>
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
    maxWidth: '960px',
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
    maxWidth: '680px',
  },
  heroLinks: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
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
  summaryCard: {
    padding: '18px',
    borderRadius: '20px',
    backgroundColor: '#f8fafc',
    display: 'grid',
    gap: '10px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
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

export default WalkInPickupPage;
