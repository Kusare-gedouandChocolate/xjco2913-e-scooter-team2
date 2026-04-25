import React, { useEffect, useState } from 'react';

import { bookingsApi, scootersApi, walkInApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { Booking, PricingRule, Scooter } from '../types';
import { getAuthUser } from '../utils/auth';
import { formatDateTime, formatPrice } from '../utils/format';

export const ClerkPage: React.FC = () => {
  const user = getAuthUser();
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cardToken, setCardToken] = useState('tok_walkin_demo');
  const [selectedScooterId, setSelectedScooterId] = useState('');
  const [selectedHireType, setSelectedHireType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scooterRes, ruleRes, bookingRes] = await Promise.all([
        scootersApi.getScooters(),
        scootersApi.getPricingRules(),
        bookingsApi.getMyBookings(),
      ]);
      setScooters(scooterRes.data || []);
      setRules(ruleRes.data || []);
      setBookings(bookingRes.data || []);
      setSelectedScooterId((current) => current || scooterRes.data?.[0]?.scooterId || '');
      setSelectedHireType((current) => current || ruleRes.data?.[0]?.hireType || '');
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load clerk workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeBookings = bookings.filter((item) => String(item.status).toLowerCase() === 'active');
  const pendingPickups = bookings.filter((item) => String(item.status).toLowerCase() === 'pendingpickup');
  const selectedRule = rules.find((item) => item.hireType === selectedHireType);

  const handleCreateWalkIn = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !selectedScooterId || !selectedHireType) {
      setMessage('Please complete all required walk-in fields.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await walkInApi.createCustomer({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        cardToken: cardToken.trim(),
      });

      const scooter = scooters.find((item) => item.scooterId === selectedScooterId);
      const response = await walkInApi.createRental({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        cardToken: cardToken.trim(),
        scooterId: selectedScooterId,
        hireType: selectedHireType,
        batteryLevelAtCheckout: scooter?.batteryLevel ?? 85,
        liabilityConsent: true,
      });

      setMessage(`Walk-in rental created: ${response.data.bookingId}`);
      await fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      setMessage(apiError.message || 'Unable to create the walk-in rental.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Clerk only</p>
          <h1 style={styles.title}>Store desk for walk-in rentals, pickup handover, and returns.</h1>
          <p style={styles.subtitle}>
            This workspace is visible only for clerk accounts, matching the sprint requirement
            for role-based access to in-store operations.
          </p>
        </div>
        <div style={styles.heroBadge}>
          <span style={styles.badgeLabel}>Signed in as</span>
          <strong>{user?.email || 'clerk account'}</strong>
        </div>
      </section>

      <StateWrapper loading={loading} error={error} onRetry={fetchData}>
        <div style={styles.grid}>
          <section style={styles.panel}>
            <p style={styles.sectionEyebrow}>Walk-in create</p>
            <h2 style={styles.sectionTitle}>Customer intake and card binding</h2>
            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span>Name</span>
                <input style={styles.input} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </label>
              <label style={styles.field}>
                <span>Phone</span>
                <input style={styles.input} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
              </label>
              <label style={styles.field}>
                <span>Card token</span>
                <input style={styles.input} value={cardToken} onChange={(event) => setCardToken(event.target.value)} />
              </label>
              <label style={styles.field}>
                <span>Scooter</span>
                <select style={styles.input} value={selectedScooterId} onChange={(event) => setSelectedScooterId(event.target.value)}>
                  {scooters.map((scooter) => (
                    <option key={scooter.scooterId} value={scooter.scooterId}>
                      #{scooter.code} {scooter.model || ''}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                <span>Hire type</span>
                <select style={styles.input} value={selectedHireType} onChange={(event) => setSelectedHireType(event.target.value)}>
                  {rules.map((rule) => (
                    <option key={rule.ruleId} value={rule.hireType}>
                      {rule.hireType} - {formatPrice(rule.price)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={styles.summaryCard}>
              <span>Charge preview</span>
              <strong>{formatPrice(selectedRule?.price || 0)}</strong>
            </div>
            {message && <div style={styles.message}>{message}</div>}
            <button style={styles.primaryButton} onClick={handleCreateWalkIn} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Create walk-in rental'}
            </button>
          </section>

          <section style={styles.panel}>
            <p style={styles.sectionEyebrow}>Pickup queue</p>
            <h2 style={styles.sectionTitle}>Remote orders waiting at store</h2>
            <div style={styles.list}>
              {pendingPickups.length === 0 ? (
                <div style={styles.empty}>No pending pickup orders.</div>
              ) : (
                pendingPickups.map((booking) => (
                  <article key={booking.bookingId} style={styles.listCard}>
                    <strong>{booking.bookingId}</strong>
                    <span>{booking.hireType}</span>
                    <span>{formatDateTime(booking.startTime)}</span>
                  </article>
                ))
              )}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.sectionEyebrow}>Return queue</p>
            <h2 style={styles.sectionTitle}>Active rides ready for settlement</h2>
            <div style={styles.list}>
              {activeBookings.length === 0 ? (
                <div style={styles.empty}>No active rides right now.</div>
              ) : (
                activeBookings.map((booking) => (
                  <article key={booking.bookingId} style={styles.listCard}>
                    <strong>{booking.bookingId}</strong>
                    <span>{booking.hireType}</span>
                    <span>{formatDateTime(booking.startTime)}</span>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </StateWrapper>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
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
    fontSize: 'clamp(2rem, 3vw, 3.2rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
    maxWidth: '800px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '720px',
  },
  heroBadge: {
    padding: '20px',
    borderRadius: '24px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  badgeLabel: {
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '18px',
  },
  panel: {
    padding: '22px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sectionEyebrow: {
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontSize: '1.35rem',
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
  summaryCard: {
    padding: '16px',
    borderRadius: '18px',
    backgroundColor: '#f7f4eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  primaryButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
  list: {
    display: 'grid',
    gap: '10px',
  },
  listCard: {
    padding: '14px 16px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    display: 'grid',
    gap: '6px',
  },
  empty: {
    padding: '20px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    color: 'var(--color-text-muted)',
  },
};
