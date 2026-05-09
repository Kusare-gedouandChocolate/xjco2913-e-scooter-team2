import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bookingsApi } from '../api';
import type { Booking } from '../types';
import { getAuthUser } from '../utils/auth';
import { formatDateTime } from '../utils/format';

type LookupStatus = 'idle' | 'loading' | 'loaded' | 'error';
type VerifyStatus = 'idle' | 'success' | 'error';

type BookingPreview = {
  bookingId: string;
  status: string;
  pickupCodeExpiresAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  pickupBatteryLevel?: number;
  scooterStatus?: string;
  scooterName?: string;
};

export const PickupVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [bookingId, setBookingId] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [lookupMessage, setLookupMessage] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedPreviewStatus = useMemo(
    () => (preview ? String(preview.status).toUpperCase() : ''),
    [preview],
  );

  const handleLookup = async () => {
    if (!bookingId.trim()) {
      setLookupStatus('error');
      setLookupMessage('Booking ID is required before status lookup.');
      setPreview(null);
      return;
    }

    setLookupStatus('loading');
    setLookupMessage('');
    setVerifyStatus('idle');
    setVerifyMessage('');

    try {
      const response = await bookingsApi.getBookingDetail(bookingId.trim());
      const nextPreview = normalizePreview(response.data, bookingId.trim());
      setPreview(nextPreview);
      setLookupStatus('loaded');
      setLookupMessage(`Current order status: ${getStatusLabel(nextPreview.status)}.`);
    } catch (err) {
      const apiError = err as { message?: string };
      setPreview(null);
      setLookupStatus('error');
      setLookupMessage(apiError.message || 'Unable to load this booking.');
    }
  };

  const handleVerify = async () => {
    if (!bookingId.trim() || !pickupCode.trim()) {
      setVerifyStatus('error');
      setVerifyMessage('Booking ID and pickup code are required.');
      return;
    }

    setVerifyStatus('idle');
    setVerifyMessage('');
    setSubmitting(true);

    try {
      const response = await bookingsApi.verifyPickup(bookingId.trim(), {
        pickupCode: pickupCode.trim(),
        verifiedBy: user?.userId || user?.email,
      });

      const detail: BookingPreview = {
        bookingId: response.data.bookingId,
        status: response.data.status,
        scooterStatus: response.data.scooterStatus,
        pickedUpAt: response.data.pickedUpAt,
        pickupBatteryLevel: response.data.pickupBatteryLevel,
        scooterName: preview?.scooterName,
        pickupCodeExpiresAt: preview?.pickupCodeExpiresAt,
        completedAt: preview?.completedAt,
      };

      setPreview(detail);
      setVerifyStatus('success');
      setVerifyMessage('Pickup verified. Redirecting to order detail...');

      navigate(`/pickup-verification/orders/${response.data.bookingId}`, {
        state: {
          detail,
          successMessage: `Booking ${response.data.bookingId} was handed over successfully in store.`,
        },
      });
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      setVerifyStatus('error');
      setVerifyMessage(resolveVerifyError(apiError.code, apiError.message, preview?.status));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBookingId('');
    setPickupCode('');
    setLookupStatus('idle');
    setVerifyStatus('idle');
    setLookupMessage('');
    setVerifyMessage('');
    setPreview(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>Remote To Store</p>
        <h1 style={styles.title}>Pickup code verification for in-store handover.</h1>
        <p style={styles.subtitle}>
          Look up the order first, confirm it is awaiting pickup, then validate the pickup code.
          After a successful verification the page jumps to the order detail view.
        </p>
      </section>

      <section style={styles.card} className="responsive-page-card">
        <div style={styles.stepRow} className="responsive-step-row">
          <Step title="1. Lookup order" active />
          <Step title="2. Verify code" active={lookupStatus === 'loaded' || verifyStatus === 'success'} />
          <Step title="3. Review detail" active={verifyStatus === 'success'} />
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field} htmlFor="pickup-booking-id">
            <span>Booking ID</span>
            <div style={styles.inlineField} className="responsive-inline-field">
              <input
                id="pickup-booking-id"
                style={styles.input}
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                placeholder="Enter booking ID"
                autoComplete="off"
              />
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={handleLookup}
                disabled={lookupStatus === 'loading'}
              >
                {lookupStatus === 'loading' ? 'Loading...' : 'Check status'}
              </button>
            </div>
          </label>

          <label style={styles.field} htmlFor="pickup-code">
            <span>Pickup Code</span>
            <input
              id="pickup-code"
              style={styles.input}
              value={pickupCode}
              onChange={(event) => setPickupCode(event.target.value)}
              placeholder="Enter 6-digit pickup code"
              inputMode="numeric"
            />
          </label>
        </div>

        {lookupMessage && (
          <div
            style={lookupStatus === 'error' ? styles.errorBox : styles.infoBox}
            role={lookupStatus === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {lookupMessage}
          </div>
        )}

        {preview && (
          <section style={styles.previewCard} role="status" aria-live="polite">
            <div style={styles.previewHeader}>
              <div>
                <p style={styles.previewLabel}>Order Preview</p>
                <strong>{preview.bookingId}</strong>
              </div>
              <span style={statusPill(preview.status)}>{getStatusLabel(preview.status)}</span>
            </div>

            <div style={styles.statusTimeline} className="responsive-step-row">
              <TimelineStatus title="Awaiting Pickup" active={isStatusAtLeast(normalizedPreviewStatus, 'AWAITING_PICKUP')} />
              <TimelineStatus title="In Progress" active={isStatusAtLeast(normalizedPreviewStatus, 'IN_PROGRESS')} />
              <TimelineStatus title="Completed" active={isStatusAtLeast(normalizedPreviewStatus, 'COMPLETED')} />
            </div>

            <div style={styles.previewGrid} className="responsive-preview-grid">
              <PreviewItem label="Vehicle" value={preview.scooterName || '--'} />
              <PreviewItem label="Scooter Status" value={preview.scooterStatus || '--'} />
              <PreviewItem label="Code Expires" value={formatDateTime(preview.pickupCodeExpiresAt)} />
              <PreviewItem label="Picked Up At" value={formatDateTime(preview.pickedUpAt)} />
              <PreviewItem label="Completed At" value={formatDateTime(preview.completedAt)} />
              <PreviewItem
                label="Pickup Battery"
                value={preview.pickupBatteryLevel != null ? `${preview.pickupBatteryLevel}%` : '--'}
              />
            </div>
          </section>
        )}

        {verifyMessage && (
          <div
            style={verifyStatus === 'success' ? styles.successBox : styles.errorBox}
            role={verifyStatus === 'success' ? 'status' : 'alert'}
            aria-live="polite"
          >
            {verifyMessage}
          </div>
        )}

        <div style={styles.actions} className="responsive-actions">
          <button type="button" style={styles.secondaryButton} onClick={resetForm}>
            Reset
          </button>
          <button type="button" style={styles.primaryButton} onClick={handleVerify} disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify pickup'}
          </button>
        </div>
      </section>
    </div>
  );
};

const normalizePreview = (raw: Booking, fallbackBookingId: string): BookingPreview => ({
  bookingId: String(raw.bookingId || fallbackBookingId),
  status: String(raw.status || 'PENDING_PAYMENT'),
  pickupCodeExpiresAt: toOptionalString(raw.pickupCodeExpiresAt),
  pickedUpAt: toOptionalString(raw.pickedUpAt),
  completedAt: toOptionalString(raw.completedAt),
  pickupBatteryLevel: typeof raw.pickupBatteryLevel === 'number' ? raw.pickupBatteryLevel : undefined,
  scooterStatus: raw.scooterStatus,
  scooterName: raw.scooterName,
});

const toOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value ? value : undefined;
};

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

const resolveVerifyError = (code?: string, message?: string, currentStatus?: string): string => {
  const normalizedCode = String(code || '').toUpperCase();
  const normalizedStatus = String(currentStatus || '').toUpperCase();

  if (normalizedCode === 'PICKUP_CODE_EXPIRED') {
    return 'The pickup code has expired. Generate a fresh code before retrying.';
  }

  if (normalizedCode === 'PICKUP_CODE_INVALID') {
    return 'The pickup code is invalid. Check the 6-digit code and try again.';
  }

  if (normalizedCode === 'BOOKING_CONFLICT') {
    if (normalizedStatus === 'IN_PROGRESS') {
      return 'This order has already been picked up.';
    }
    if (normalizedStatus === 'COMPLETED') {
      return 'This order is already completed and cannot be verified again.';
    }
    return 'This order is not awaiting pickup. Check the current status before retrying.';
  }

  return message || 'Verification failed. The code may be invalid, expired, or already used.';
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

const Step = ({ title, active }: { title: string; active?: boolean }) => (
  <div style={active ? styles.stepActive : styles.step}>
    <strong>{title}</strong>
  </div>
);

const TimelineStatus = ({ title, active }: { title: string; active: boolean }) => (
  <div style={active ? styles.timelineActive : styles.timelineStep}>
    <strong>{title}</strong>
  </div>
);

const PreviewItem = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.previewItem}>
    <span style={styles.previewItemLabel}>{label}</span>
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
      ? '#9a3412'
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
  inlineField: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '10px',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#ffffff',
  },
  infoBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    color: 'var(--color-text-main)',
    fontWeight: 700,
  },
  previewCard: {
    padding: '18px',
    borderRadius: '22px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  previewLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  statusTimeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  timelineStep: {
    padding: '12px',
    borderRadius: '16px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-muted)',
  },
  timelineActive: {
    padding: '12px',
    borderRadius: '16px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  previewItem: {
    padding: '14px',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  previewItemLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 700,
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
    color: '#9a3412',
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
    backgroundColor: '#e2e8f0',
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

export default PickupVerificationPage;
