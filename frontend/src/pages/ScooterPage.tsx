import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { bookingsApi, mapsApi, scootersApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { PricingRule, Scooter, ScooterLocation, ScooterStatus } from '../types';
import { formatPrice, getUTCTimeString } from '../utils/format';
import { getScooterImage, getScooterSpecs } from '../utils/scooterVisual';

const createIcon = (color: string) =>
  L.divIcon({
    className: 'custom-scooter-marker',
    html: `<div style="width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 4px 14px rgba(15,23,42,.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const availableIcon = createIcon('#0f766e');
const offlineIcon = createIcon('#94a3b8');

const statusText: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  unavailable: 'Unavailable',
  maintenance: 'Maintenance',
  in_use: 'In Use',
  locked: 'Locked',
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  LOCKED: 'Locked',
};

export const ScooterPage: React.FC = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [locations, setLocations] = useState<ScooterLocation[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [selectedScooterId, setSelectedScooterId] = useState<string | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [bookingState, setBookingState] = useState<'idle' | 'booking' | 'paying' | 'success'>('idle');
  const [bookingError, setBookingError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scooterRes, locationRes, pricingRes] = await Promise.all([
        scootersApi.getScooters(),
        mapsApi.getLocations(onlyAvailable),
        scootersApi.getPricingRules(),
      ]);
      setScooters(scooterRes.data || []);
      setLocations(locationRes.data || []);
      setRules(pricingRes.data || []);
      setSelectedRuleId((current) => current || pricingRes.data?.[0]?.ruleId || '');
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load scooter fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyAvailable]);

  const selectedScooter =
    scooters.find((item) => item.scooterId === selectedScooterId) || null;
  const selectedRule =
    rules.find((item) => item.ruleId === selectedRuleId) || rules[0] || null;

  const availableScooters = scooters.filter((item) => isAvailable(item.status));
  const displayScooters = onlyAvailable ? availableScooters : scooters;
  const featuredScooter = selectedScooter || displayScooters[0] || null;
  const featuredSpecs = featuredScooter ? getScooterSpecs(featuredScooter) : null;

  const handleOpenBooking = (scooter: Scooter) => {
    setSelectedScooterId(scooter.scooterId);
    setSelectedRuleId((current) => current || rules[0]?.ruleId || '');
    setBookingState('idle');
    setBookingError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedScooter || !selectedRule) {
      return;
    }

    setBookingError('');
    setBookingState('booking');

    try {
      const bookingResponse = await bookingsApi.createBooking({
        scooterId: selectedScooter.scooterId,
        rentalOptionId: selectedRule.ruleId,
        hireType: selectedRule.hireType,
        startTime: getUTCTimeString(),
      });

      setBookingState('paying');
      await bookingsApi.payBooking({
        bookingId: bookingResponse.data.bookingId,
        paymentMethod: 'CARD_ON_FILE',
      });

      setBookingState('success');
      await fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      setBookingError(apiError.message || 'Unable to create the booking right now.');
      setBookingState('idle');
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <p style={styles.kicker}>Sprint 3 fleet experience</p>
          <h1 style={styles.title}>Reserve the right scooter with a richer booking preview.</h1>
          <p style={styles.subtitle}>
            Browse live positions, compare performance, preview a larger product image,
            and switch models before checkout while pricing updates instantly.
          </p>
          <div style={styles.filterGroup}>
            <button
              style={filterButton(onlyAvailable)}
              onClick={() => setOnlyAvailable(true)}
            >
              Available only
            </button>
            <button
              style={filterButton(!onlyAvailable)}
              onClick={() => setOnlyAvailable(false)}
            >
              Full fleet
            </button>
          </div>
        </div>

        {featuredScooter && featuredSpecs && (
          <div style={styles.heroCard}>
            <img
              alt={featuredScooter.code}
              src={getScooterImage(featuredScooter)}
              style={styles.heroImage}
            />
            <div style={styles.heroOverlay}>
              <div>
                <p style={styles.heroLabel}>{featuredScooter.model || 'Urban Ride Series'}</p>
                <h2 style={styles.heroName}>#{featuredScooter.code}</h2>
              </div>
              <button
                style={styles.imageButton}
                onClick={() => setPreviewImage(getScooterImage(featuredScooter))}
              >
                Expand image
              </button>
            </div>
            <div style={styles.metricGrid}>
              <Metric label="Battery" value={`${featuredSpecs.batteryLevel}%`} />
              <Metric label="Top speed" value={`${featuredSpecs.topSpeedKph} km/h`} />
              <Metric label="Range" value={`${featuredSpecs.rangeKm} km`} />
              <Metric label="Motor" value={`${featuredSpecs.motorPowerW} W`} />
            </div>
          </div>
        )}
      </section>

      <StateWrapper
        loading={loading}
        error={error}
        empty={displayScooters.length === 0}
        emptyMessage="No scooters match this filter yet."
        onRetry={fetchData}
      >
        <section style={styles.layout}>
          <div style={styles.mapPanel}>
            <div style={styles.sectionHeading}>
              <div>
                <p style={styles.sectionEyebrow}>Live pickup map</p>
                <h2 style={styles.sectionTitle}>Store and curbside availability</h2>
              </div>
            </div>

            <div style={styles.mapFrame}>
              <MapContainer
                center={locations[0] ? [locations[0].latitude, locations[0].longitude] : [53.8, -1.55]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {locations.map((location) => (
                  <Marker
                    key={location.scooterId}
                    position={[location.latitude, location.longitude]}
                    icon={isAvailable(location.status) ? availableIcon : offlineIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '160px' }}>
                        <strong>#{location.code}</strong>
                        <p>{location.locationZone}</p>
                        <p>{statusText[location.status] || location.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div style={styles.listPanel}>
            <div style={styles.sectionHeading}>
              <div>
                <p style={styles.sectionEyebrow}>Book with confidence</p>
                <h2 style={styles.sectionTitle}>Vehicle cards with richer detail</h2>
              </div>
            </div>

            <div style={styles.cardGrid}>
              {displayScooters.map((scooter) => {
                const specs = getScooterSpecs(scooter);
                const available = isAvailable(scooter.status);
                return (
                  <article key={scooter.scooterId} style={styles.scooterCard}>
                    <img
                      alt={scooter.code}
                      src={getScooterImage(scooter)}
                      style={styles.cardImage}
                    />
                    <div style={styles.cardContent}>
                      <div style={styles.cardHeader}>
                        <div>
                          <p style={styles.cardModel}>{scooter.model || 'RideFlow Urban'}</p>
                          <h3 style={styles.cardCode}>#{scooter.code}</h3>
                        </div>
                        <span style={statusBadge(available)}>
                          {statusText[scooter.status] || scooter.status}
                        </span>
                      </div>

                      <p style={styles.locationLine}>{scooter.location}</p>
                      <p style={styles.note}>{specs.performanceNote}</p>

                      <div style={styles.specRow}>
                        <span>{specs.topSpeedKph} km/h</span>
                        <span>{specs.rangeKm} km range</span>
                        <span>{specs.batteryLevel}% battery</span>
                      </div>

                      <div style={styles.priceBand}>
                        <span>Base ride rate</span>
                        <strong>{formatPrice(scooter.basePrice)}</strong>
                      </div>

                      <div style={styles.cardActions}>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setPreviewImage(getScooterImage(scooter))}
                        >
                          Preview
                        </button>
                        <button
                          style={primaryButton(available)}
                          disabled={!available}
                          onClick={() => handleOpenBooking(scooter)}
                        >
                          Reserve
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </StateWrapper>

      {selectedScooter && selectedRule && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <p style={styles.sectionEyebrow}>Sprint 3 booking panel</p>
                <h3 style={styles.modalTitle}>Switch scooter model before checkout</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedScooterId(null)}>
                Close
              </button>
            </div>

            <div style={styles.modalLayout}>
              <div>
                <img
                  alt={selectedScooter.code}
                  src={getScooterImage(selectedScooter)}
                  style={styles.modalImage}
                />
                <button
                  style={{ ...styles.imageButton, marginTop: '12px' }}
                  onClick={() => setPreviewImage(getScooterImage(selectedScooter))}
                >
                  Expand product image
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.modalBlock}>
                  <p style={styles.fieldLabel}>Selected scooter</p>
                  <div style={styles.optionGrid}>
                    {availableScooters.map((scooter) => (
                      <button
                        key={scooter.scooterId}
                        style={optionButton(selectedScooter.scooterId === scooter.scooterId)}
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Switch booking preview to scooter #${scooter.code}?`,
                          );
                          if (confirmed) {
                            setSelectedScooterId(scooter.scooterId);
                          }
                        }}
                      >
                        <strong>#{scooter.code}</strong>
                        <span>{scooter.model || 'Urban Ride'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.modalBlock}>
                  <p style={styles.fieldLabel}>Hire type</p>
                  <div style={styles.optionGrid}>
                    {rules.map((rule) => (
                      <button
                        key={rule.ruleId}
                        style={optionButton(selectedRule.ruleId === rule.ruleId)}
                        onClick={() => setSelectedRuleId(rule.ruleId)}
                      >
                        <strong>{rule.hireType}</strong>
                        <span>{formatPrice(rule.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.summaryBox}>
                  <p style={styles.fieldLabel}>Pricing preview</p>
                  <div style={styles.summaryRow}>
                    <span>Model</span>
                    <strong>{selectedScooter.model || `Scooter #${selectedScooter.code}`}</strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Hire package</span>
                    <strong>{selectedRule.hireType}</strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Estimated fare</span>
                    <strong>{formatPrice(selectedRule.price)}</strong>
                  </div>
                </div>

                {bookingError && <div style={styles.errorBox}>{bookingError}</div>}

                {bookingState === 'success' ? (
                  <div style={styles.successPanel}>
                    <h4>Booking created</h4>
                    <p>Your selection and payment have been confirmed successfully.</p>
                    <button style={styles.successButton} onClick={() => setSelectedScooterId(null)}>
                      Finish
                    </button>
                  </div>
                ) : (
                  <div style={styles.footerActions}>
                    <button style={styles.ghostButton} onClick={() => setSelectedScooterId(null)}>
                      Cancel
                    </button>
                    <button
                      style={styles.successButton}
                      onClick={handleConfirmBooking}
                      disabled={bookingState !== 'idle'}
                    >
                      {bookingState === 'booking'
                        ? 'Creating booking...'
                        : bookingState === 'paying'
                          ? 'Processing payment...'
                          : 'Confirm and pay'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div style={styles.modalBackdrop} onClick={() => setPreviewImage(null)}>
          <div style={styles.lightbox} onClick={(event) => event.stopPropagation()}>
            <img alt="Expanded scooter preview" src={previewImage} style={styles.lightboxImage} />
            <button style={styles.closeButton} onClick={() => setPreviewImage(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
};

const isAvailable = (status: ScooterStatus): boolean => {
  return String(status).toLowerCase() === 'available';
};

const filterButton = (active: boolean) => ({
  padding: '10px 16px',
  borderRadius: '999px',
  backgroundColor: active ? '#1f2937' : 'rgba(255,255,255,0.72)',
  color: active ? '#ffffff' : 'var(--color-text-main)',
  fontWeight: 700,
  boxShadow: active ? 'var(--shadow-sm)' : 'none',
});

const statusBadge = (available: boolean) => ({
  padding: '6px 10px',
  borderRadius: '999px',
  backgroundColor: available ? 'var(--color-primary-soft)' : '#eef2f7',
  color: available ? 'var(--color-primary)' : 'var(--color-text-muted)',
  fontSize: '0.8rem',
  fontWeight: 700,
});

const primaryButton = (enabled: boolean) => ({
  flex: 1,
  padding: '12px 16px',
  borderRadius: '14px',
  backgroundColor: enabled ? 'var(--color-primary)' : '#cbd5e1',
  color: '#ffffff',
  fontWeight: 700,
});

const optionButton = (selected: boolean) => ({
  padding: '14px',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
  alignItems: 'flex-start',
  textAlign: 'left' as const,
  backgroundColor: selected ? '#effcf8' : '#f8fafc',
  border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
});

const styles = {
  page: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
    gap: '24px',
    alignItems: 'stretch',
  },
  heroText: {
    padding: '24px 4px',
  },
  kicker: {
    color: 'var(--color-accent)',
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  title: {
    fontSize: 'clamp(2.2rem, 4vw, 4.1rem)',
    lineHeight: 1.02,
    letterSpacing: '-0.04em',
    marginBottom: '16px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '620px',
    fontSize: '1.04rem',
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    flexWrap: 'wrap' as const,
  },
  heroCard: {
    backgroundColor: 'var(--color-surface-strong)',
    borderRadius: '28px',
    padding: '18px',
    boxShadow: 'var(--shadow-md)',
  },
  heroImage: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover' as const,
    borderRadius: '22px',
  },
  heroOverlay: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    marginTop: '14px',
  },
  heroLabel: {
    color: 'var(--color-text-muted)',
  },
  heroName: {
    fontSize: '1.6rem',
  },
  imageButton: {
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontWeight: 700,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  metricCard: {
    padding: '14px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metricLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  metricValue: {
    fontSize: '1.1rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
    gap: '24px',
  },
  mapPanel: {
    padding: '22px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    minHeight: '620px',
  },
  listPanel: {
    padding: '22px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
  },
  sectionHeading: {
    marginBottom: '18px',
  },
  sectionEyebrow: {
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    marginTop: '4px',
    fontSize: '1.4rem',
  },
  mapFrame: {
    overflow: 'hidden',
    borderRadius: '22px',
    height: '540px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
  },
  scooterCard: {
    overflow: 'hidden',
    borderRadius: '24px',
    backgroundColor: '#fcfcfb',
    border: '1px solid var(--color-border)',
  },
  cardImage: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover' as const,
  },
  cardContent: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
  },
  cardModel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
  },
  cardCode: {
    fontSize: '1.28rem',
  },
  locationLine: {
    fontWeight: 700,
  },
  note: {
    color: 'var(--color-text-muted)',
    fontSize: '0.94rem',
  },
  specRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
  },
  priceBand: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#f7f4eb',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
  },
  secondaryButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#eef2f7',
    color: 'var(--color-text-main)',
    fontWeight: 700,
  },
  modalBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 80,
  },
  modal: {
    width: 'min(1040px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto' as const,
    borderRadius: '30px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-md)',
    padding: '24px',
  },
  modalTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '1.5rem',
  },
  closeButton: {
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#eef2f7',
    fontWeight: 700,
  },
  modalLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
    gap: '22px',
  },
  modalImage: {
    width: '100%',
    borderRadius: '24px',
    aspectRatio: '16 / 10',
    objectFit: 'cover' as const,
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  modalBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  fieldLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
  },
  summaryBox: {
    padding: '18px',
    borderRadius: '22px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  errorBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#fff7ed',
    color: 'var(--color-accent)',
    fontWeight: 700,
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  ghostButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#eef2f7',
    fontWeight: 700,
  },
  successButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
  successPanel: {
    padding: '20px',
    borderRadius: '22px',
    backgroundColor: '#effcf8',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  lightbox: {
    width: 'min(980px, 100%)',
    borderRadius: '28px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  lightboxImage: {
    width: '100%',
    maxHeight: '75vh',
    objectFit: 'contain' as const,
    borderRadius: '20px',
    backgroundColor: '#0f172a',
  },
};
