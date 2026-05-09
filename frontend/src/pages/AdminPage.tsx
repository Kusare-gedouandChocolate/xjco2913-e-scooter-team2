import React, { useEffect, useState } from 'react';

import { adminApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type {
  AdminScooterRequest,
  AdminScooterResponse,
  AdminScooterStatus,
  PricingRuleResponse,
  PricingRuleUpdateRequest,
} from '../types';
import { formatPrice } from '../utils/format';

type AdminTab = 'scooters' | 'pricing';

const scooterStatusLabels: Record<AdminScooterStatus, string> = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  LOCKED: 'Locked',
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('scooters');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scooters, setScooters] = useState<AdminScooterResponse[]>([]);
  const [rules, setRules] = useState<PricingRuleResponse[]>([]);

  const [editingScooter, setEditingScooter] = useState<AdminScooterResponse | null>(null);
  const [editingRule, setEditingRule] = useState<PricingRuleResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [scooterForm, setScooterForm] = useState<AdminScooterRequest>({
    model: '',
    status: 'AVAILABLE',
    batteryLevel: 100,
    currentLocation: '',
  });
  const [ruleForm, setRuleForm] = useState<PricingRuleUpdateRequest>({
    hireType: '',
    durationHours: 1,
    price: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'scooters') {
        const response = await adminApi.getAllScooters();
        setScooters(response.data || []);
      } else {
        const response = await adminApi.getPricingRules();
        setRules(response.data || []);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const openScooterEditor = (scooter: AdminScooterResponse) => {
    setEditingScooter(scooter);
    setEditingRule(null);
    setFormError('');
    setFormSuccess('');
    setScooterForm({
      model: scooter.model,
      status: scooter.status,
      batteryLevel: scooter.batteryLevel,
      currentLocation: scooter.currentLocation,
    });
  };

  const openRuleEditor = (rule: PricingRuleResponse) => {
    setEditingRule(rule);
    setEditingScooter(null);
    setFormError('');
    setFormSuccess('');
    setRuleForm({
      hireType: rule.hireType,
      durationHours: rule.durationHours ?? 1,
      price: rule.price,
    });
  };

  const closeModal = () => {
    setEditingScooter(null);
    setEditingRule(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleSaveScooter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingScooter) {
      return;
    }

    setActionLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await adminApi.updateScooter(editingScooter.scooterId, scooterForm);
      closeModal();
      setFormSuccess('Scooter updated successfully.');
      fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      setFormError(apiError.message || 'Failed to update scooter.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRule) {
      return;
    }

    setActionLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await adminApi.updatePricingRule(editingRule.ruleId, ruleForm);
      closeModal();
      setFormSuccess('Pricing rule updated successfully.');
      fetchData();
    } catch (err) {
      const apiError = err as { message?: string };
      setFormError(apiError.message || 'Failed to update pricing rule.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero} className="responsive-hero">
        <div>
          <p style={styles.kicker}>Admin Center</p>
          <h1 style={styles.title}>Fleet and pricing configuration.</h1>
          <p style={styles.subtitle}>
            Manage scooters and pricing rules with a single layout that works on desktop and mobile.
          </p>
        </div>

        <div style={styles.tabRow} className="responsive-admin-tabs">
          <button
            type="button"
            style={tabButton(activeTab === 'scooters')}
            onClick={() => setActiveTab('scooters')}
          >
            Scooters
          </button>
          <button
            type="button"
            style={tabButton(activeTab === 'pricing')}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </button>
        </div>
      </section>

      {formSuccess && (
        <div style={styles.successBox} role="status" aria-live="polite">
          {formSuccess}
        </div>
      )}

      <StateWrapper
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={activeTab === 'scooters' ? scooters.length === 0 : rules.length === 0}
        emptyMessage={activeTab === 'scooters' ? 'No scooters found.' : 'No pricing rules found.'}
      >
        {activeTab === 'scooters' ? (
          <div style={styles.grid} className="responsive-admin-grid">
            {scooters.map((scooter) => (
              <article key={scooter.scooterId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.cardLabel}>Scooter</p>
                    <h2 style={styles.cardTitle}>{scooter.model}</h2>
                  </div>
                  <span style={statusBadge(scooter.status)}>
                    {scooterStatusLabels[scooter.status]}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <InfoRow label="Battery" value={`${scooter.batteryLevel}%`} />
                  <InfoRow label="Location" value={scooter.currentLocation} />
                  <InfoRow label="Created" value={new Date(scooter.createdAt).toLocaleDateString('en-GB')} />
                </div>

                <button type="button" style={styles.primaryButton} onClick={() => openScooterEditor(scooter)}>
                  Edit scooter
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div style={styles.grid} className="responsive-admin-grid">
            {rules.map((rule) => (
              <article key={rule.ruleId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.cardLabel}>Pricing Rule</p>
                    <h2 style={styles.cardTitle}>{rule.hireType}</h2>
                  </div>
                  <span style={styles.ruleBadge}>
                    {rule.discountEnabled ? 'Discount Enabled' : 'Standard'}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <InfoRow label="Duration" value={`${rule.durationHours ?? 1} h`} />
                  <InfoRow label="Price" value={formatPrice(rule.price)} />
                  <InfoRow label="Discount" value={rule.discountEnabled ? 'Yes' : 'No'} />
                </div>

                <button type="button" style={styles.primaryButton} onClick={() => openRuleEditor(rule)}>
                  Edit pricing
                </button>
              </article>
            ))}
          </div>
        )}
      </StateWrapper>

      {(editingScooter || editingRule) && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={styles.modal}
            className="responsive-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={editingScooter ? 'admin-scooter-title' : 'admin-rule-title'}
          >
            {editingScooter && (
              <form onSubmit={handleSaveScooter} style={styles.modalForm} aria-busy={actionLoading}>
                <div>
                  <p style={styles.cardLabel}>Scooter Editor</p>
                  <h2 id="admin-scooter-title" style={styles.modalTitle}>
                    Edit {editingScooter.model}
                  </h2>
                </div>

                <label style={styles.field} htmlFor="admin-scooter-model">
                  <span>Model</span>
                  <input
                    id="admin-scooter-model"
                    style={styles.input}
                    value={scooterForm.model}
                    onChange={(event) => setScooterForm({ ...scooterForm, model: event.target.value })}
                  />
                </label>

                <label style={styles.field} htmlFor="admin-scooter-status">
                  <span>Status</span>
                  <select
                    id="admin-scooter-status"
                    style={styles.input}
                    value={scooterForm.status}
                    onChange={(event) => {
                      setScooterForm({ ...scooterForm, status: event.target.value as AdminScooterStatus });
                    }}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </label>

                <label style={styles.field} htmlFor="admin-scooter-battery">
                  <span>Battery Level</span>
                  <input
                    id="admin-scooter-battery"
                    type="number"
                    min="0"
                    max="100"
                    style={styles.input}
                    value={scooterForm.batteryLevel}
                    onChange={(event) => {
                      setScooterForm({ ...scooterForm, batteryLevel: Number(event.target.value) || 0 });
                    }}
                  />
                </label>

                <label style={styles.field} htmlFor="admin-scooter-location">
                  <span>Current Location</span>
                  <input
                    id="admin-scooter-location"
                    style={styles.input}
                    value={scooterForm.currentLocation}
                    onChange={(event) => {
                      setScooterForm({ ...scooterForm, currentLocation: event.target.value });
                    }}
                  />
                </label>

                {formError && <div style={styles.errorBox} role="alert">{formError}</div>}

                <div style={styles.modalActions} className="responsive-admin-actions">
                  <button type="button" style={styles.secondaryButton} onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryButton} disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save scooter'}
                  </button>
                </div>
              </form>
            )}

            {editingRule && (
              <form onSubmit={handleSaveRule} style={styles.modalForm} aria-busy={actionLoading}>
                <div>
                  <p style={styles.cardLabel}>Pricing Editor</p>
                  <h2 id="admin-rule-title" style={styles.modalTitle}>
                    Edit {editingRule.hireType}
                  </h2>
                </div>

                <label style={styles.field} htmlFor="admin-rule-name">
                  <span>Hire Type</span>
                  <input
                    id="admin-rule-name"
                    style={styles.input}
                    value={ruleForm.hireType}
                    onChange={(event) => setRuleForm({ ...ruleForm, hireType: event.target.value })}
                  />
                </label>

                <label style={styles.field} htmlFor="admin-rule-duration">
                  <span>Duration Hours</span>
                  <input
                    id="admin-rule-duration"
                    type="number"
                    min="1"
                    style={styles.input}
                    value={ruleForm.durationHours}
                    onChange={(event) => {
                      setRuleForm({ ...ruleForm, durationHours: Number(event.target.value) || 1 });
                    }}
                  />
                </label>

                <label style={styles.field} htmlFor="admin-rule-price">
                  <span>Price</span>
                  <input
                    id="admin-rule-price"
                    type="number"
                    min="0"
                    style={styles.input}
                    value={ruleForm.price}
                    onChange={(event) => {
                      setRuleForm({ ...ruleForm, price: Number(event.target.value) || 0 });
                    }}
                  />
                  <span style={styles.helperText}>Preview: {formatPrice(ruleForm.price)}</span>
                </label>

                {formError && <div style={styles.errorBox} role="alert">{formError}</div>}

                <div style={styles.modalActions} className="responsive-admin-actions">
                  <button type="button" style={styles.secondaryButton} onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryButton} disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save pricing'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const tabButton = (active: boolean) => ({
  padding: '12px 18px',
  borderRadius: '14px',
  backgroundColor: active ? 'var(--color-primary)' : '#e2e8f0',
  color: active ? '#ffffff' : 'var(--color-text-main)',
  fontWeight: 700,
});

const statusBadge = (status: AdminScooterStatus) => ({
  padding: '8px 12px',
  borderRadius: '999px',
  backgroundColor:
    status === 'AVAILABLE'
      ? '#d7f3ee'
      : status === 'IN_USE'
        ? '#dbeafe'
        : status === 'MAINTENANCE'
          ? '#fef3c7'
          : '#e2e8f0',
  color:
    status === 'AVAILABLE'
      ? 'var(--color-primary)'
      : status === 'IN_USE'
        ? '#1d4ed8'
        : status === 'MAINTENANCE'
          ? '#92400e'
          : 'var(--color-text-main)',
  fontWeight: 700,
  fontSize: '0.82rem',
});

const styles = {
  page: {
    maxWidth: '1180px',
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
    fontSize: 'clamp(2rem, 3vw, 3.2rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '640px',
  },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    minWidth: '280px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '22px',
    borderRadius: '24px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  cardTitle: {
    fontSize: '1.3rem',
  },
  cardBody: {
    display: 'grid',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  infoLabel: {
    color: 'var(--color-text-muted)',
  },
  ruleBadge: {
    padding: '8px 12px',
    borderRadius: '999px',
    backgroundColor: '#f8fafc',
    color: 'var(--color-text-main)',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  primaryButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
  secondaryButton: {
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: '#e2e8f0',
    color: 'var(--color-text-main)',
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
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 100,
  },
  modal: {
    width: 'min(520px, 100%)',
    backgroundColor: 'var(--color-surface-strong)',
    borderRadius: '28px',
    boxShadow: 'var(--shadow-md)',
    padding: '24px',
  },
  modalForm: {
    display: 'grid',
    gap: '14px',
  },
  modalTitle: {
    fontSize: '1.4rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontWeight: 700,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#ffffff',
  },
  helperText: {
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
};

export default AdminPage;
