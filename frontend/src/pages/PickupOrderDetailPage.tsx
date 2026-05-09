import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { bookingsApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { Booking } from '../types';
import { formatDateTime } from '../utils/format';

type PickupOrderDetail = {
  bookingId: string;
  status: string;
  scooterStatus?: string;
  scooterName?: string;
  pickupCodeExpiresAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  pickupBatteryLevel?: number;
};

type LocationState = {
  detail?: PickupOrderDetail;
  successMessage?: string;
};

export const PickupOrderDetailPage: React.FC = () => {
  const { bookingId = '' } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const [detail, setDetail] = useState<PickupOrderDetail | null>(state.detail || null);
  const [loading, setLoading] = useState(!state.detail);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!bookingId) {
      setError('Booking ID is missing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.getBookingDetail(bookingId);
      setDetail(normalizeBookingDetail(response.data, bookingId));
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Unable to load booking detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!state.detail) {
      fetchDetail();
    }
  }, [bookingId]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Remote Handover Result</p>
          <h1 style={styles.title}>Order detail after in-store pickup verification.</h1>
          <p style={styles.subtitle}>
            This page shows the latest order state so the remote booking to in-store handover flow
            can be demonstrated end to end.
          </p>
        </div>
        <div style={styles.linkRow}>
          <Link to="/pickup-verification" style={styles.secondaryLink}>Back to verification</Link>
          <Link to="/bookings" style={styles.secondaryLink}>My journeys</Link>
        </div>
      </section>

      {state.successMessage && <div style={styles.successBox}>{state.successMessage}</div>}

      <StateWrapper loading={loading} error={error} onRetry={fetchDetail}>
        {detail && (
          <section style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <p style={styles.metaLabel}>Booking ID</p>
                <h2 style={styles.bookingId}>{detail.bookingId}</h2>
              </div>
              <span style={statusPill(detail.status)}>{getStatusLabel(detail.status)}</span>
            </div>

            <div style={styles.timeline}>
              <StatusStep title="Awaiting Pickup" active={isStatusAtLeast(detail.status, 'AWAITING_PICKUP')} />
              <StatusStep title="In Progress" active={isStatusAtLeast(detail.status, 'IN_PROGRESS')} />
              <StatusStep title="Completed" active={isStatusAtLeast(detail.status, 'COMPLETED')} />
            </div>

            <div style={styles.infoGrid}>
              <InfoRow label="Order Status" value={getStatusLabel(detail.status)} />
              <InfoRow label="Scooter Status" value={detail.scooterStatus || '--'} />
              <InfoRow label="Vehicle" value={detail.scooterName || '--'} />
              <InfoRow label="Code Expires" value={formatDateTime(detail.pickupCodeExpiresAt)} />
              <InfoRow label="Picked Up At" value={formatDateTime(detail.pickedUpAt)} />
              <InfoRow label="Completed At" value={formatDateTime(detail.completedAt)} />
              <InfoRow
                label="Pickup Battery"
                value={detail.pickupBatteryLevel != null ? `${detail.pickupBatteryLevel}%` : '--'}
              />
            </div>
          </section>
        )}
      </StateWrapper>
    </div>
  );
};

const normalizeBookingDetail = (
  raw: Booking,
  fallbackBookingId: string,
): PickupOrderDetail => ({
  bookingId: String(raw.bookingId || fallbackBookingId),
  status: String(raw.status || 'PENDING_PAYMENT'),
  scooterStatus: raw.scooterStatus,
  scooterName: raw.scooterName,
  pickupCodeExpiresAt: raw.pickupCodeExpiresAt,
  pickedUpAt: raw.pickedUpAt,
  completedAt: raw.completedAt,
  pickupBatteryLevel: raw.pickupBatteryLevel,
});

const getStatusLabel = (status: string): string => {
  switch (String(status).toUpperCase()) {
    case 'AWAITING_PICKUP':
      return 'Awaiting Pickup';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Pending Payment';
  }
};

const isStatusAtLeast = (
  status: string,
  target: 'AWAITING_PICKUP' | 'IN_PROGRESS' | 'COMPLETED',
): boolean => {
  const rank: Record<string, number> = {
    PENDING_PAYMENT: 0,
    AWAITING_PICKUP: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 0,
  };

  return (rank[String(status).toUpperCase()] || 0) >= rank[target];
};

const StatusStep = ({ title, active }: { title: string; active: boolean }) => (
  <div style={active ? styles.stepActive : styles.step}>
    <strong>{title}</strong>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const statusPill = (status: string) => ({
  padding: '8px 12px',
  borderRadius: '999px',
  backgroundColor:
    String(status).toUpperCase() === 'AWAITING_PICKUP'
      ? '#fff7ed'
      : String(status).toUpperCase() === 'IN_PROGRESS'
        ? 'var(--color-primary-soft)'
        : '#eef2f7',
  color:
    String(status).toUpperCase() === 'AWAITING_PICKUP'
      ? 'var(--color-accent)'
      : String(status).toUpperCase() === 'IN_PROGRESS'
        ? 'var(--color-primary)'
        : 'var(--color-text-muted)',
  fontWeight: 800,
});

const styles = {
  page: {
    maxWidth: '980px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
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
    fontSize: 'clamp(2rem, 3vw, 3.2rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '720px',
  },
  linkRow: {
    display: 'flex',
    gap: '10px',
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
  successBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
    fontWeight: 700,
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  metaLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  bookingId: {
    fontSize: '1.5rem',
  },
  timeline: {
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
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  infoRow: {
    padding: '16px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  infoLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.82rem',
    fontWeight: 700,
  },
};

export default PickupOrderDetailPage;
