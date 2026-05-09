import React from 'react';
import { Link } from 'react-router-dom';

import { getAuthUser } from '../utils/auth';

const deskCards = [
  {
    title: 'Customer Intake',
    path: '/clerk/customers',
    eyebrow: 'Step 1',
    description: 'Capture the minimum customer profile and bind a card token before a walk-in rental.',
    cta: 'Open intake form',
  },
  {
    title: 'Walk-In Pickup',
    path: '/clerk/pickup',
    eyebrow: 'Step 2',
    description: 'Assign an available scooter, select a package, and create the in-store rental order.',
    cta: 'Start pickup',
  },
  {
    title: 'Walk-In Return',
    path: '/clerk/return',
    eyebrow: 'Step 3',
    description: 'Close the rental, report any damage, and review the final billing breakdown.',
    cta: 'Process return',
  },
  {
    title: 'Remote Pickup Verify',
    path: '/pickup-verification',
    eyebrow: 'Remote flow',
    description: 'Validate pickup codes for web or app orders collected at the store.',
    cta: 'Verify code',
  },
];

export const ClerkPage: React.FC = () => {
  const user = getAuthUser();

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Store Operations</p>
          <h1 style={styles.title}>Desk workspace for intake, pickup, return, and remote handover.</h1>
          <p style={styles.subtitle}>
            Access is restricted to clerk, staff, manager, and admin accounts. Use the steps below
            to complete the full in-store flow without customer self-registration.
          </p>
        </div>

        <div style={styles.accountCard}>
          <span style={styles.accountLabel}>Signed in</span>
          <strong>{user?.fullName || user?.email || 'Store staff'}</strong>
          <span style={styles.accountMeta}>{user?.role || 'staff'}</span>
        </div>
      </section>

      <section style={styles.grid}>
        {deskCards.map((card) => (
          <article key={card.path} style={styles.card}>
            <p style={styles.cardEyebrow}>{card.eyebrow}</p>
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={styles.cardDescription}>{card.description}</p>
            <Link to={card.path} style={styles.cardLink}>
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section style={styles.notesCard}>
        <h2 style={styles.notesTitle}>Operating Notes</h2>
        <div style={styles.notesGrid}>
          <div style={styles.noteBlock}>
            <strong>Card token rule</strong>
            <p style={styles.noteText}>Use `tok_` followed by 12 to 64 letters or digits.</p>
          </div>
          <div style={styles.noteBlock}>
            <strong>Recommended flow</strong>
            <p style={styles.noteText}>Create customer, complete pickup, then close the order in the return page.</p>
          </div>
          <div style={styles.noteBlock}>
            <strong>Remote orders</strong>
            <p style={styles.noteText}>Keep pickup verification separate so the status trail stays easy to demo.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)',
    gap: '22px',
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
    fontSize: 'clamp(2rem, 3vw, 3.5rem)',
    lineHeight: 1.04,
    letterSpacing: '-0.04em',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    maxWidth: '760px',
  },
  accountCard: {
    padding: '22px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    justifyContent: 'center',
  },
  accountLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  accountMeta: {
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '22px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  cardEyebrow: {
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontSize: '1.35rem',
  },
  cardDescription: {
    color: 'var(--color-text-muted)',
    flex: 1,
  },
  cardLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },
  notesCard: {
    padding: '24px',
    borderRadius: '28px',
    backgroundColor: 'var(--color-surface-strong)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  notesTitle: {
    fontSize: '1.3rem',
  },
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  noteBlock: {
    padding: '16px',
    borderRadius: '20px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  noteText: {
    color: 'var(--color-text-muted)',
  },
};

export default ClerkPage;
