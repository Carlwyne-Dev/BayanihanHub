import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { getTrustConfig } from '@/components/Badges';
import type { TrustLabel } from '@/lib/db/schema';

const trustLabels: TrustLabel[] = [
  'needs_review', 'recently_updated', 'source_provided',
  'user_confirmed', 'reported', 'resolved', 'expired',
];

const iconBg: Record<TrustLabel, string> = {
  needs_review:     'var(--status-review)',
  recently_updated: 'var(--primary)',
  source_provided:  'var(--surface-container-highest)',
  user_confirmed:   'var(--inverse-surface)',
  reported:         'var(--error-container)',
  resolved:         'var(--status-resolved)',
  expired:          'var(--surface-container-highest)',
};
const iconColor: Record<TrustLabel, string> = {
  needs_review:     'var(--status-review-text)',
  recently_updated: 'white',
  source_provided:  'var(--on-surface)',
  user_confirmed:   'white',
  reported:         'var(--on-error-container)',
  resolved:         'var(--status-resolved-text)',
  expired:          'var(--outline)',
};
const badgeLabel: Record<TrustLabel, string> = {
  needs_review:     'STATUS',
  recently_updated: 'STATUS',
  source_provided:  'TRUST',
  user_confirmed:   'TRUST',
  reported:         'STATUS',
  resolved:         'STATUS',
  expired:          'STATUS',
};
const badgeBg: Record<TrustLabel, string> = {
  needs_review:     'var(--surface-container-highest)',
  recently_updated: 'var(--primary)',
  source_provided:  'var(--surface-container-highest)',
  user_confirmed:   'var(--inverse-surface)',
  reported:         'var(--error)',
  resolved:         'var(--surface-container-highest)',
  expired:          'var(--surface-container-highest)',
};
const badgeColor: Record<TrustLabel, string> = {
  needs_review:     'var(--on-surface-variant)',
  recently_updated: 'white',
  source_provided:  'var(--on-surface-variant)',
  user_confirmed:   'white',
  reported:         'white',
  resolved:         'var(--on-surface-variant)',
  expired:          'var(--outline)',
};

export const metadata = {
  title: 'Trust & Safety — BayanihanHub',
  description: 'How BayanihanHub handles trust, verification, and community safety.',
};

export default function TrustPage() {
  return (
    <div className="page-wrapper">
      <header className="top-bar">
        <Link href="/" className="btn btn-ghost btn-icon" aria-label="Go back">
          <ArrowLeft size={22} />
        </Link>
        <span className="top-bar-title">Trust &amp; Safety</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="page-content" style={{ paddingTop: 24 }}>
        <h1 className="headline-md" style={{ marginBottom: 8 }}>How we verify our community</h1>
        <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: 28, lineHeight: 1.7 }}>
          To keep our community safe and ensure help gets to where it&apos;s truly needed, we use a clear labeling system.
          Here is what each label means when you see a request or offer in our hub.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trustLabels.map(label => {
            const cfg = getTrustConfig(label);
            return (
              <div key={label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius)',
                  background: iconBg[label], color: iconColor[label],
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <p className="title-sm" style={{ fontSize: 16 }}>{cfg.label}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      padding: '2px 8px', borderRadius: 999,
                      background: badgeBg[label], color: badgeColor[label],
                    }}>
                      {badgeLabel[label]}
                    </span>
                  </div>
                  <p className="body-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                    {cfg.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 24, background: 'var(--primary-fixed)', border: 'none' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Shield size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="title-sm" style={{ fontSize: 15, marginBottom: 6 }}>Our commitment</p>
              <p className="body-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                BayanihanHub surfaces information and lets community members judge, rather than making claims of certainty we cannot back up.
                We never use &quot;AI Verified&quot; badges. Trust is built by the community, for the community.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
