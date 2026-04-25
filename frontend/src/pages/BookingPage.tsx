import React, { useEffect, useState } from 'react';

import { bookingsApi, scootersApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { Booking, BookingStatus, PricingRule, Scooter, Settlement } from '../types';
import { isClerk } from '../utils/auth';
import { formatDateTime, formatPercent, formatPrice, getBatteryDelta } from '../utils/format';
import { getScooterImage, getScooterSpecs } from '../utils/scooterVisual';

type BookingTab = 'all' | 'pendingPickup' | 'active' | 'completed';

export const BookingPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>('all');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState('');
  const [returnBattery, setReturnBattery] = useState('55');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageFee, setDamageFee] = useState('0');
  const [returnNotes, setReturnNotes] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingRes, scooterRes, pricingRes] = await Promise.all([
        bookingsApi.getMyBookings(),
        scootersApi.getScooters(),
        scootersApi.getPricingRules(),
      ]);
      setBookings(bookingRes.data || []);
      setScooters(scooterRes.data || []);
      setPricingRules(pricingRes.data || []);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const normalized = normalizeBookingStatus(booking.status);
    if (activeTab === 'all') {
      return true;
    }
    if (activeTab === 'pendingPickup') {
      return normalized === 'pendingPickup';
    }
    if (activeTab === 'active') {
      return normalized === 'active';
    }
    return normalized === 'completed';
  });

  const openSettlement = async (booking: Booking) => {
    setSelectedBookingId(booking.bookingId);
    setSettlement(booking.settlement || null);
    setSettlementError('');
    setSubmitMessage('');
    setReturnBattery(String(booking.batteryLevelAtReturn ?? booking.settlement?.batteryLevelAtReturn ?? 55));
    setDamageDescription('');
    setDamageFee('0');
    setReturnNotes('');
    setSettlementLoading(true);

    try {
      const response = await bookingsApi.getSettlement(booking.bookingId);
      setSettlement(response.data);
      setReturnBattery(String(response.data.batteryLevelAtReturn ?? 55));
    } catch (err) {
      const apiError = err as { message?: string };
      setSettlementError(apiError.message || 'Settlement details are not available yet.');
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) {
      return;
    }
    try {
      await bookingsApi.cancelBooking(bookingId);
      await fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      window.alert(apiError.message || 'Unable to cancel this booking.');
    }
  };

  const handleReturnSubmit = async () => {
    if (!selectedBookingId) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');
    setSettlementError('');

    try {
      if (damageDescription.trim()) {
        await bookingsApi.reportDamage(selectedBookingId, {
          description: damageDescription.trim(),
          estimatedFeeInCents: Number(damageFee || 0),
        });
      }

      await bookingsApi.createReturn(selectedBookingId, {
        batteryLevelAtReturn: Number(returnBattery),
        notes: returnNotes.trim() || undefined,
      });

      const settlementResponse = await bookingsApi.getSettlement(selectedBookingId);
      setSettlement(settlementResponse.data);
      setSubmitMessage('Return submitted successfully. Charges have been refreshed.');
      await fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      setSettlementError(apiError.message || 'Unable to complete the return flow.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Sprint 3 bookings</p>
          <h1 style={styles.title}>Transparent order detail, pickup state, and return settlement.</h1>
          <p style={styles.subtitle}>
            Each booking now carries a richer scooter preview, clearer status milestones,
            and a settlement drawer for battery delta, overtime, and damage reporting.
          </p>
        </div>
        <div style={styles.heroStats}>
          <StatCard label="Bookings" value={String(bookings.length)} />
          <StatCard
            label="Pending pickup"
            value={String(bookings.filter((item) => normalizeBookingStatus(item.status) === 'pendingPickup').length)}
          />
          <StatCard
            label="Active"
            value={String(bookings.filter((item) => normalizeBookingStatus(item.status) === 'active').length)}
          />
        </div>
      </section>

      <div style={styles.tabs}>
        {(['all', 'pendingPickup', 'active', 'completed'] as BookingTab[]).map((tab) => (
          <button
            key={tab}
            style={tabButton(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all'
              ? 'All'
              : tab === 'pendingPickup'
                ? 'Pending pickup'
                : tab === 'active'
                  ? 'Active'
                  : 'Completed'}
          </button>
        ))}
      </div>

      <StateWrapper
        loading={loading}
        error={error}
        empty={filteredBookings.length === 0}
        emptyMessage="No bookings match this filter."
        onRetry={fetchData}
      >
        <div style={styles.bookingGrid}>
          {filteredBookings.map((booking) => {
            const scooter = resolveScooter(booking, scooters);
            const specs = getScooterSpecs(scooter || {});
            const rule = pricingRules.find((item) => item.hireType === booking.hireType);
            const status = normalizeBookingStatus(booking.status);

            return (
              <article key={booking.bookingId} style={styles.card}>
                <div style={styles.cardMedia}>
                  <img
                    alt={booking.scooterName || booking.scooterId}
                    src={getScooterImage(scooter || { code: booking.scooterId.slice(-4) })}
                    style={styles.cardImage}
                  />
                  <button
                    style={styles.previewButton}
                    onClick={() => setImagePreview(getScooterImage(scooter || { code: booking.scooterId.slice(-4) }))}
                  >
                    Expand
                  </button>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardHeading}>
                    <div>
                      <p style={styles.microLabel}>{booking.hireMode || 'remote'}</p>
                      <h2 style={styles.cardTitle}>
                        {booking.scooterName || scooter?.model || `Scooter #${booking.scooterId.slice(-4)}`}
                      </h2>
                    </div>
                    <span style={statusPill(status)}>
                      {status === 'pendingPickup'
                        ? 'Pending pickup'
                        : status === 'active'
                          ? 'Active'
                          : status === 'completed'
                            ? 'Completed'
                            : 'Pending payment'}
                    </span>
                  </div>

                  <div style={styles.specStrip}>
                    <span>{specs.topSpeedKph} km/h</span>
                    <span>{specs.rangeKm} km range</span>
                    <span>{specs.motorPowerW} W motor</span>
                  </div>

                  <div style={styles.infoGrid}>
                    <InfoRow label="Hire type" value={booking.hireType} />
                    <InfoRow label="Start time" value={formatDateTime(booking.startTime)} />
                    <InfoRow label="Expected end" value={formatDateTime(booking.endTime)} />
                    <InfoRow label="Charge preview" value={formatPrice(rule?.price ?? booking.totalCost)} />
                    <InfoRow label="Pickup code" value={booking.pickupCode || 'Shown after remote confirmation'} />
                    <InfoRow
                      label="Discount"
                      value={
                        booking.appliedDiscountRate
                          ? `${booking.appliedDiscountType || 'Applied'} ${formatPercent(booking.appliedDiscountRate)}`
                          : 'No discount'
                      }
                    />
                  </div>

                  <div style={styles.checkoutBanner}>
                    <MetricSmall label="Battery out" value={`${booking.batteryLevelAtCheckout ?? scooter?.batteryLevel ?? 82}%`} />
                    <MetricSmall
                      label="Battery back"
                      value={
                        booking.batteryLevelAtReturn != null
                          ? `${booking.batteryLevelAtReturn}%`
                          : booking.settlement?.batteryLevelAtReturn != null
                            ? `${booking.settlement.batteryLevelAtReturn}%`
                            : '--'
                      }
                    />
                    <MetricSmall label="Fare" value={formatPrice(booking.totalCost)} />
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.ghostButton} onClick={() => openSettlement(booking)}>
                      Settlement
                    </button>
                    {canCancel(booking.status) && (
                      <button style={styles.cancelButton} onClick={() => handleCancel(booking.bookingId)}>
                        Cancel
                      </button>
                    )}
                    {(status === 'active' || isClerk()) && (
                      <button style={styles.primaryButton} onClick={() => openSettlement(booking)}>
                        Return flow
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </StateWrapper>

      {selectedBookingId && (
        <div style={styles.drawerBackdrop} onClick={() => setSelectedBookingId(null)}>
          <div style={styles.drawer} onClick={(event) => event.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <p style={styles.kicker}>Return settlement</p>
                <h3 style={styles.drawerTitle}>Battery, overtime, damage, and final bill</h3>
              </div>
              <button style={styles.previewButton} onClick={() => setSelectedBookingId(null)}>Close</button>
            </div>

            {settlementLoading ? (
              <StateWrapper loading={true}> <div /> </StateWrapper>
            ) : (
              <div style={styles.drawerContent}>
                {settlementError && <div style={styles.errorBox}>{settlementError}</div>}

                {settlement && (
                  <div style={styles.feePanel}>
                    <MetricSmall label="Battery out" value={`${settlement.batteryLevelAtCheckout ?? '--'}%`} />
                    <MetricSmall label="Battery back" value={`${settlement.batteryLevelAtReturn ?? '--'}%`} />
                    <MetricSmall
                      label="Battery delta"
                      value={`${getBatteryDelta(settlement.batteryLevelAtCheckout, settlement.batteryLevelAtReturn)}%`}
                    />
                    <MetricSmall label="Overtime" value={`${settlement.overtimeMinutes ?? 0} min`} />
                  </div>
                )}

                {settlement && (
                  <div style={styles.billCard}>
                    <InfoRow label="Base fee" value={formatPrice(settlement.fees.baseFeeInCents)} />
                    <InfoRow label="Overtime fee" value={formatPrice(settlement.fees.overtimeFeeInCents)} />
                    <InfoRow label="Battery delta fee" value={formatPrice(settlement.fees.batteryDeltaFeeInCents)} />
                    <InfoRow label="Damage fee" value={formatPrice(settlement.fees.damageFeeInCents)} />
                    <InfoRow label="Total" value={formatPrice(settlement.fees.totalInCents)} bold />
                  </div>
                )}

                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>Battery at return</span>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      max="100"
                      value={returnBattery}
                      onChange={(event) => setReturnBattery(event.target.value)}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Estimated damage fee in cents</span>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      value={damageFee}
                      onChange={(event) => setDamageFee(event.target.value)}
                    />
                  </label>

                  <label style={{ ...styles.field, gridColumn: '1 / -1' }}>
                    <span style={styles.label}>Damage report</span>
                    <textarea
                      style={styles.textarea}
                      rows={4}
                      value={damageDescription}
                      onChange={(event) => setDamageDescription(event.target.value)}
                      placeholder="Describe scratches, brake issues, or body damage if any."
                    />
                  </label>

                  <label style={{ ...styles.field, gridColumn: '1 / -1' }}>
                    <span style={styles.label}>Return notes</span>
                    <textarea
                      style={styles.textarea}
                      rows={3}
                      value={returnNotes}
                      onChange={(event) => setReturnNotes(event.target.value)}
                      placeholder="Optional handover or settlement notes."
                    />
                  </label>
                </div>

                {submitMessage && <div style={styles.successBox}>{submitMessage}</div>}

                <div style={styles.submitRow}>
                  <button style={styles.ghostButton} onClick={() => setSelectedBookingId(null)}>
                    Close
                  </button>
                  <button
                    style={styles.primaryButton}
                    onClick={handleReturnSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Confirm return'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {imagePreview && (
        <div style={styles.drawerBackdrop} onClick={() => setImagePreview(null)}>
          <div style={styles.imageModal} onClick={(event) => event.stopPropagation()}>
            <img alt="Scooter preview" src={imagePreview} style={styles.imageModalImage} />
            <button style={styles.previewButton} onClick={() => setImagePreview(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const normalizeBookingStatus = (status: BookingStatus): 'pendingPayment' | 'pendingPickup' | 'active' | 'completed' => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'pendingpickup') {
    return 'pendingPickup';
  }
  if (normalized === 'active' || normalized === 'paid') {
    return 'active';
  }
  if (normalized === 'completed' || normalized === 'cancelled') {
    return 'completed';
  }
  return 'pendingPayment';
};

const canCancel = (status: BookingStatus): boolean => {
  const normalized = String(status).toLowerCase();
  return normalized === 'pending_payment' || normalized === 'pendingpayment' || normalized === 'pendingpickup';
};

const resolveScooter = (booking: Booking, scooters: Scooter[]): Scooter | undefined => {
  return scooters.find((item) => item.scooterId === booking.scooterId);
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.statCard}>
    <span style={styles.statLabel}>{label}</span>
    <strong style={styles.statValue}>{value}</strong>
  </div>
);

const MetricSmall = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.metricSmall}>
    <span style={styles.label}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const InfoRow = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={bold ? styles.infoValueStrong : styles.infoValue}>{value}</span>
  </div>
);

const tabButton = (active: boolean) => ({
  padding: '10px 16px',
  borderRadius: '999px',
  backgroundColor: active ? '#1f2937' : 'rgba(255,255,255,0.8)',
  color: active ? '#ffffff' : 'var(--color-text-main)',
  fontWeight: 700,
});

const statusPill = (status: string) => ({
  padding: '6px 10px',
  borderRadius: '999px',
  backgroundColor:
    status === 'pendingPickup'
      ? '#fff7ed'
      : status === 'active'
        ? 'var(--color-primary-soft)'
        : '#eef2f7',
  color:
    status === 'pendingPickup'
      ? 'var(--color-accent)'
      : status === 'active'
        ? 'var(--color-primary)'
        : 'var(--color-text-muted)',
  fontSize: '0.8rem',
  fontWeight: 700,
});

const styles = {
  page: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
    gap: '24px',
    alignItems: 'stretch',
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
    fontSize: 'clamp(2rem, 3vw, 3.6rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '14px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '720px',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '24px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  statLabel: {
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  statValue: {
    fontSize: '2rem',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  bookingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '18px',
  },
  card: {
    overflow: 'hidden',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(255,255,255,0.8)',
  },
  cardMedia: {
    position: 'relative' as const,
  },
  cardImage: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover' as const,
  },
  previewButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    color: '#ffffff',
    fontWeight: 700,
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  cardHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
  },
  microLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  cardTitle: {
    fontSize: '1.35rem',
  },
  specStrip: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
  },
  infoGrid: {
    display: 'grid',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: 'var(--color-text-muted)',
  },
  infoValue: {
    color: 'var(--color-text-main)',
    textAlign: 'right' as const,
  },
  infoValueStrong: {
    color: 'var(--color-text-main)',
    fontWeight: 800,
    textAlign: 'right' as const,
  },
  checkoutBanner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  metricSmall: {
    padding: '14px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  ghostButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#eef2f7',
    fontWeight: 700,
  },
  cancelButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#fff7ed',
    color: 'var(--color-accent)',
    fontWeight: 700,
  },
  primaryButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
  drawerBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 70,
  },
  drawer: {
    width: 'min(620px, 100%)',
    backgroundColor: 'var(--color-surface-strong)',
    padding: '22px',
    overflow: 'auto' as const,
    boxShadow: 'var(--shadow-md)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '18px',
  },
  drawerTitle: {
    fontSize: '1.35rem',
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  feePanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  billCard: {
    padding: '18px',
    borderRadius: '22px',
    backgroundColor: '#f8fafc',
    display: 'grid',
    gap: '10px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#ffffff',
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#ffffff',
    resize: 'vertical' as const,
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
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  imageModal: {
    width: 'min(980px, 100%)',
    margin: 'auto',
    padding: '18px',
    borderRadius: '28px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  imageModalImage: {
    width: '100%',
    maxHeight: '80vh',
    objectFit: 'contain' as const,
    borderRadius: '18px',
    backgroundColor: '#0f172a',
  },
};
