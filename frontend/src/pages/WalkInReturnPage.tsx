import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { bookingsApi, walkInApi } from '../api';
import type { Booking, WalkInReturnResponse } from '../types';
import { formatDateTime, formatPrice } from '../utils/format';

const LAST_BOOKING_KEY = 'clerkLastBookingId';
const BATTERY_USAGE_FEE_PER_PERCENT = 20;

type DamageLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type BookingPreview = {
  bookingId: string;
  status: string;
  pickupBatteryLevel?: number;
  returnBatteryLevel?: number;
  pickedUpAt?: string;
  completedAt?: string;
  scooterName?: string;
  scooterBatteryLevel?: number;
  baseRentalFee?: number;
  durationHours?: number;
};

type BillingPreview = {
  baseRentalFee: number;
  overtimeMinutes: number;
  overtimeFee: number;
  batteryLevelDelta: number | null;
  batteryUsagePercent: number;
  batteryUsageFee: number;
  damageFee: number;
  total: number;
  missingFields: string[];
};

export const WalkInReturnPage: React.FC = () => {
  const [bookingId, setBookingId] = useState(window.sessionStorage.getItem(LAST_BOOKING_KEY) || '');
  const [damaged, setDamaged] = useState(false);
  const [damageLevel, setDamageLevel] = useState<DamageLevel>('LOW');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageImageUrl, setDamageImageUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<WalkInReturnResponse | null>(null);

  const billingPreview = useMemo(
    () => buildBillingPreview(preview, damaged, damageLevel),
    [preview, damaged, damageLevel],
  );

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!bookingId.trim()) {
      nextErrors.bookingId = 'Booking ID is required.';
    } else if (!/^\d+$/.test(bookingId.trim())) {
      nextErrors.bookingId = 'Booking ID must be numeric.';
    }

    if (damaged && !damageDescription.trim()) {
      nextErrors.damageDescription = 'Provide a damage description when damage is reported.';
    }

    if (damaged && damageImageUrl.trim()) {
      try {
        new URL(damageImageUrl.trim());
      } catch {
        nextErrors.damageImageUrl = 'Damage image URL must be a valid URL.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLoadPreview = async () => {
    if (!bookingId.trim()) {
      setFieldErrors({ bookingId: 'Booking ID is required.' });
      return;
    }

    setLoadingPreview(true);
    setLoadingError('');
    setSubmitError('');
    setResult(null);

    try {
      const response = await bookingsApi.getBookingDetail(bookingId.trim());
      setPreview(normalizeBookingPreview(response.data, bookingId.trim()));
    } catch (err) {
      const apiError = err as { message?: string };
      setPreview(null);
      setLoadingError(apiError.message || 'Unable to load booking preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setResult(null);

    try {
      const response = await walkInApi.returnScooter({
        bookingId: Number(bookingId.trim()),
        damaged,
        damageDescription: damaged ? damageDescription.trim() : undefined,
        damageImageUrl: damaged && damageImageUrl.trim() ? damageImageUrl.trim() : undefined,
        damageLevel: damaged ? damageLevel : undefined,
      });

      window.sessionStorage.setItem(LAST_BOOKING_KEY, response.data.bookingId);
      setResult(response.data);
    } catch (err) {
      const apiError = err as { message?: string };
      setSubmitError(apiError.message || 'Unable to complete the return flow.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero} className="responsive-hero">
        <div>
          <p style={styles.kicker}>Walk-In Return</p>
          <h1 style={styles.title}>Transparent return settlement for battery, overtime, and damage.</h1>
          <p style={styles.subtitle}>
            Load the booking first to inspect the projected charges, then confirm the return.
            If some source fields are missing, the final backend settlement remains authoritative.
          </p>
        </div>
        <div style={styles.heroLinks} className="responsive-links">
          <Link to="/clerk" style={styles.secondaryLink}>Back to desk</Link>
          <Link to="/clerk/pickup" style={styles.secondaryLink}>Back to pickup</Link>
        </div>
      </section>

      <section style={styles.card} className="responsive-page-card">
        <form onSubmit={handleSubmit} style={styles.form} aria-busy={submitting || loadingPreview}>
          <label style={styles.field} htmlFor="walkin-return-booking-id">
            <span>Booking ID</span>
            <div style={styles.inlineField} className="responsive-inline-field">
              <input
                id="walkin-return-booking-id"
                style={inputStyle(Boolean(fieldErrors.bookingId))}
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                placeholder="Numeric booking ID"
                autoComplete="off"
              />
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={handleLoadPreview}
                disabled={loadingPreview}
              >
                {loadingPreview ? 'Loading...' : 'Load preview'}
              </button>
            </div>
            {fieldErrors.bookingId && <span style={styles.fieldError}>{fieldErrors.bookingId}</span>}
          </label>

          {preview && billingPreview && (
            <section style={styles.previewCard} role="status" aria-live="polite">
              <div style={styles.previewHeader}>
                <div>
                  <p style={styles.previewEyebrow}>Return preview</p>
                  <h2 style={styles.previewTitle}>{preview.scooterName || `Booking ${preview.bookingId}`}</h2>
                </div>
                <span style={styles.statusPill}>{preview.status}</span>
              </div>

              <div style={styles.previewGrid} className="responsive-preview-grid">
                <MetricCard label="Pickup battery" value={asBattery(preview.pickupBatteryLevel)} hint="Recorded at pickup" />
                <MetricCard
                  label="Return battery"
                  value={asBattery(preview.returnBatteryLevel ?? preview.scooterBatteryLevel)}
                  hint={preview.returnBatteryLevel != null ? 'Recorded return value' : 'Using live scooter battery'}
                />
                <MetricCard
                  label="Battery delta"
                  value={billingPreview.batteryLevelDelta != null ? `${billingPreview.batteryLevelDelta}%` : '--'}
                  hint="Pickup minus return"
                />
                <MetricCard
                  label="Overtime"
                  value={`${billingPreview.overtimeMinutes} min`}
                  hint={preview.durationHours != null ? `Package: ${preview.durationHours} h` : 'Package missing'}
                />
              </div>

              <div style={styles.timelineGrid} className="responsive-timeline-grid">
                <InfoRow label="Picked up at" value={safeDateTime(preview.pickedUpAt)} />
                <InfoRow label="Expected finish" value={resolveExpectedEnd(preview)} />
                <InfoRow label="Settlement point" value={safeDateTime(preview.completedAt) || 'Use current time'} />
                <InfoRow label="Base rental" value={formatAmount(billingPreview.baseRentalFee)} />
              </div>
            </section>
          )}

          <label style={styles.checkboxRow} htmlFor="walkin-damage-toggle">
            <input
              id="walkin-damage-toggle"
              type="checkbox"
              checked={damaged}
              onChange={(event) => setDamaged(event.target.checked)}
            />
            <span>Damage reported at return</span>
          </label>

          {damaged && (
            <>
              <label style={styles.field} htmlFor="walkin-damage-level">
                <span>Damage level</span>
                <select
                  id="walkin-damage-level"
                  style={inputStyle(false)}
                  value={damageLevel}
                  onChange={(event) => setDamageLevel(event.target.value as DamageLevel)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>

              <div style={styles.estimateBand} role="status" aria-live="polite">
                <span>Estimated damage fee</span>
                <strong>{formatAmount(getDamageFeeEstimate(damaged, damageLevel))}</strong>
              </div>

              <label style={styles.field} htmlFor="walkin-damage-description">
                <span>Damage description</span>
                <textarea
                  id="walkin-damage-description"
                  style={textAreaStyle(Boolean(fieldErrors.damageDescription))}
                  rows={4}
                  value={damageDescription}
                  onChange={(event) => setDamageDescription(event.target.value)}
                  placeholder="Describe the visible issue or handover note."
                />
                {fieldErrors.damageDescription && (
                  <span style={styles.fieldError}>{fieldErrors.damageDescription}</span>
                )}
              </label>

              <label style={styles.field} htmlFor="walkin-damage-image-url">
                <span>Damage image URL</span>
                <input
                  id="walkin-damage-image-url"
                  style={inputStyle(Boolean(fieldErrors.damageImageUrl))}
                  value={damageImageUrl}
                  onChange={(event) => setDamageImageUrl(event.target.value)}
                  placeholder="https://..."
                />
                {fieldErrors.damageImageUrl && (
                  <span style={styles.fieldError}>{fieldErrors.damageImageUrl}</span>
                )}
              </label>
            </>
          )}

          {loadingError && <div style={styles.errorBox} role="alert">{loadingError}</div>}
          {submitError && <div style={styles.errorBox} role="alert">{submitError}</div>}

          {billingPreview && (
            <section style={styles.breakdownCard} role="status" aria-live="polite">
              <div style={styles.breakdownHeader}>
                <div>
                  <p style={styles.previewEyebrow}>Projected bill before submit</p>
                  <h3 style={styles.breakdownTitle}>Charge breakdown</h3>
                </div>
                <strong style={styles.totalPill}>{formatAmount(billingPreview.total)}</strong>
              </div>

              <div style={styles.billGrid} className="responsive-bill-grid">
                <InfoRow label="Base rental fee" value={formatAmount(billingPreview.baseRentalFee)} />
                <InfoRow label="Overtime duration" value={`${billingPreview.overtimeMinutes} min`} />
                <InfoRow label="Overtime fee" value={formatAmount(billingPreview.overtimeFee)} />
                <InfoRow label="Battery usage" value={`${billingPreview.batteryUsagePercent}%`} />
                <InfoRow label="Battery usage fee" value={formatAmount(billingPreview.batteryUsageFee)} />
                <InfoRow label="Damage fee" value={formatAmount(billingPreview.damageFee)} />
              </div>

              {billingPreview.missingFields.length > 0 && (
                <div style={styles.warningBox}>
                  Missing data: {billingPreview.missingFields.join(', ')}. This preview is partial;
                  the backend settlement after submission is the source of truth.
                </div>
              )}
            </section>
          )}

          <div style={styles.actions} className="responsive-actions">
            <button type="submit" style={styles.primaryButton} disabled={submitting}>
              {submitting ? 'Completing return...' : 'Confirm and submit return'}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <section
          style={styles.billCard}
          className="responsive-page-card status-live"
          role="status"
          aria-live="polite"
        >
          <div style={styles.billHeader}>
            <div>
              <p style={styles.billEyebrow}>Return complete</p>
              <h2 style={styles.billTitle}>Booking {result.bookingId} is now {result.bookingStatus}.</h2>
            </div>
            <strong style={styles.totalPill}>{formatAmount(result.totalCost)}</strong>
          </div>

          <div style={styles.billGrid} className="responsive-bill-grid">
            <InfoRow label="Base rental" value={formatAmount(result.baseRentalFee)} />
            <InfoRow label="Overtime fee" value={formatAmount(result.overtimeFee)} />
            <InfoRow label="Battery usage fee" value={formatAmount(result.batteryUsageFee)} />
            <InfoRow label="Damage fee" value={formatAmount(result.damageFee)} />
            <InfoRow label="Pickup battery" value={asBattery(result.pickupBatteryLevel)} />
            <InfoRow label="Return battery" value={asBattery(result.returnBatteryLevel)} />
            <InfoRow label="Battery delta" value={result.batteryLevelDelta != null ? `${result.batteryLevelDelta}%` : '--'} />
            <InfoRow label="Battery usage" value={result.batteryUsagePercent != null ? `${result.batteryUsagePercent}%` : '--'} />
            <InfoRow label="Overtime" value={result.overtimeMinutes != null ? `${result.overtimeMinutes} min` : '--'} />
            <InfoRow label="Damage recorded" value={result.damageReported ? 'Yes' : 'No'} />
          </div>
        </section>
      )}
    </div>
  );
};

const normalizeBookingPreview = (raw: Booking, fallbackBookingId: string): BookingPreview => ({
  bookingId: String(raw.bookingId || fallbackBookingId),
  status: String(raw.status || 'UNKNOWN'),
  pickupBatteryLevel: asNumber(raw.pickupBatteryLevel),
  returnBatteryLevel: asNumber(raw.returnBatteryLevel),
  pickedUpAt: asString(raw.pickedUpAt),
  completedAt: asString(raw.completedAt),
  scooterName: asString(raw.scooterName),
  scooterBatteryLevel: asNumber(raw.scooterBatteryLevel),
  baseRentalFee: asMoney(raw.baseRentalFee ?? raw.originalCost ?? raw.totalCost),
  durationHours: asNumber(raw.durationHours),
});

const buildBillingPreview = (
  preview: BookingPreview | null,
  damaged: boolean,
  damageLevel: DamageLevel,
): BillingPreview | null => {
  if (!preview) {
    return null;
  }

  const missingFields: string[] = [];
  const baseRentalFee = preview.baseRentalFee ?? 0;
  if (preview.baseRentalFee == null) {
    missingFields.push('base rental fee');
  }

  const pickupBatteryLevel = preview.pickupBatteryLevel;
  const returnBatteryLevel = preview.returnBatteryLevel ?? preview.scooterBatteryLevel;
  if (pickupBatteryLevel == null) {
    missingFields.push('pickup battery');
  }
  if (returnBatteryLevel == null) {
    missingFields.push('return battery');
  }

  const batteryLevelDelta =
    pickupBatteryLevel != null && returnBatteryLevel != null
      ? Math.max(pickupBatteryLevel - returnBatteryLevel, 0)
      : null;
  const batteryUsagePercent = batteryLevelDelta ?? 0;
  const batteryUsageFee = batteryUsagePercent * BATTERY_USAGE_FEE_PER_PERCENT;

  const overtimeMinutes = calculateOvertimeMinutes(preview);
  if (preview.pickedUpAt == null) {
    missingFields.push('pickup time');
  }
  if (preview.durationHours == null) {
    missingFields.push('package duration');
  }

  const overtimeFee =
    preview.durationHours && preview.durationHours > 0 && baseRentalFee > 0
      ? roundMoney((baseRentalFee / (preview.durationHours * 60)) * overtimeMinutes)
      : 0;

  const damageFee = getDamageFeeEstimate(damaged, damageLevel);

  return {
    baseRentalFee,
    overtimeMinutes,
    overtimeFee,
    batteryLevelDelta,
    batteryUsagePercent,
    batteryUsageFee,
    damageFee,
    total: roundMoney(baseRentalFee + overtimeFee + batteryUsageFee + damageFee),
    missingFields,
  };
};

const calculateOvertimeMinutes = (preview: BookingPreview): number => {
  if (!preview.pickedUpAt || !preview.durationHours || preview.durationHours <= 0) {
    return 0;
  }

  const start = new Date(preview.pickedUpAt);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const end = preview.completedAt ? new Date(preview.completedAt) : new Date();
  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return 0;
  }

  const actualMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  const includedMinutes = preview.durationHours * 60;
  return Math.max(actualMinutes - includedMinutes, 0);
};

const getDamageFeeEstimate = (damaged: boolean, damageLevel: DamageLevel): number => {
  if (!damaged) {
    return 0;
  }

  switch (damageLevel) {
    case 'LOW':
      return 200;
    case 'MEDIUM':
      return 500;
    case 'HIGH':
      return 1000;
    default:
      return 300;
  }
};

const resolveExpectedEnd = (preview: BookingPreview): string => {
  if (!preview.pickedUpAt || !preview.durationHours) {
    return '--';
  }

  const start = new Date(preview.pickedUpAt);
  if (Number.isNaN(start.getTime())) {
    return '--';
  }

  start.setHours(start.getHours() + preview.durationHours);
  return safeDateTime(start.toISOString());
};

const safeDateTime = (value?: string): string => {
  if (!value) {
    return '--';
  }

  return formatDateTime(value);
};

const asMoney = (value: unknown): number | undefined => {
  const num = asNumber(value);
  return num == null ? undefined : roundMoney(num);
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value ? value : undefined;
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const formatAmount = (value?: string | number | null): string => {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return formatPrice(Number.isFinite(numeric) ? numeric : 0);
};

const asBattery = (value?: number | null): string => (value != null ? `${value}%` : '--');

const MetricCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div style={styles.metricCard}>
    <span style={styles.infoLabel}>{label}</span>
    <strong>{value}</strong>
    <span style={styles.metricHint}>{hint}</span>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const inputStyle = (invalid: boolean) => ({
  padding: '12px 14px',
  borderRadius: '14px',
  border: `1px solid ${invalid ? '#dc2626' : 'var(--color-border)'}`,
  backgroundColor: '#ffffff',
});

const textAreaStyle = (invalid: boolean) => ({
  ...inputStyle(invalid),
  resize: 'vertical' as const,
});

const styles = {
  page: {
    maxWidth: '1020px',
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
    maxWidth: '720px',
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
    gap: '16px',
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
  previewCard: {
    padding: '20px',
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
  previewEyebrow: {
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  previewTitle: {
    fontSize: '1.35rem',
  },
  statusPill: {
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-main)',
    fontWeight: 700,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  metricCard: {
    padding: '16px',
    borderRadius: '18px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  metricHint: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700,
  },
  estimateBand: {
    padding: '16px 18px',
    borderRadius: '18px',
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    fontWeight: 800,
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
    color: '#9a3412',
    fontWeight: 700,
  },
  warningBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontWeight: 700,
  },
  breakdownCard: {
    padding: '20px',
    borderRadius: '22px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  breakdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  breakdownTitle: {
    fontSize: '1.2rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  secondaryLink: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#e2e8f0',
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    fontWeight: 700,
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
  billCard: {
    padding: '24px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  billHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  billEyebrow: {
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  billTitle: {
    fontSize: '1.35rem',
  },
  totalPill: {
    padding: '12px 16px',
    borderRadius: '999px',
    backgroundColor: '#effcf8',
    color: 'var(--color-primary)',
  },
  billGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  infoRow: {
    padding: '16px',
    borderRadius: '18px',
    backgroundColor: '#ffffff',
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

export default WalkInReturnPage;
