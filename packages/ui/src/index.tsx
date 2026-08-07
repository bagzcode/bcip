import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export function Button({
  children,
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }>) {
  const background = variant === 'primary' ? 'var(--bcip-indigo)' : 'transparent';
  const color = variant === 'primary' ? '#fff' : 'var(--bcip-ink)';
  const border =
    variant === 'primary' ? '1px solid var(--bcip-indigo)' : '1px solid var(--bcip-border)';

  return (
    <button
      type="button"
      {...props}
      style={{
        background,
        color,
        border,
        borderRadius: 4,
        padding: '0.55rem 1rem',
        font: 'inherit',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ children }: PropsWithChildren) {
  return (
    <span
      style={{
        display: 'inline-block',
        border: '1px solid var(--bcip-clay)',
        color: 'var(--bcip-clay)',
        padding: '0.15rem 0.5rem',
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

export type StatusBadgeTone = 'neutral' | 'review' | 'access' | 'demo';

const TONE_STYLES: Record<StatusBadgeTone, { border: string; color: string; background: string }> =
  {
    neutral: {
      border: 'var(--bcip-border)',
      color: 'var(--bcip-muted)',
      background: 'transparent',
    },
    review: {
      border: 'var(--bcip-indigo)',
      color: 'var(--bcip-indigo)',
      background: 'rgba(30, 58, 95, 0.06)',
    },
    access: {
      border: 'var(--bcip-focus)',
      color: 'var(--bcip-focus)',
      background: 'rgba(15, 118, 110, 0.06)',
    },
    demo: {
      border: 'var(--bcip-clay)',
      color: 'var(--bcip-clay)',
      background: 'rgba(139, 69, 19, 0.06)',
    },
  };

/** Compact status chip for review / access / demo labels. */
export function StatusBadge({
  children,
  tone = 'neutral',
  label,
  status,
}: PropsWithChildren<{
  tone?: StatusBadgeTone;
  label?: string;
  /** Shorthand: render status text as children when children omitted. */
  status?: string;
}>) {
  const styles = TONE_STYLES[tone];
  const content = children ?? (status ? status.replaceAll('_', ' ') : null);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.35rem',
        border: `1px solid ${styles.border}`,
        color: styles.color,
        background: styles.background,
        padding: '0.2rem 0.55rem',
        fontSize: '0.72rem',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        lineHeight: 1.3,
      }}
    >
      {label ? (
        <span style={{ opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>{label}</span>
      ) : null}
      {content ? <span>{content}</span> : null}
    </span>
  );
}

export type ProvenanceStripProps = {
  reviewStatus?: string | null | undefined;
  accessTier?: string | null | undefined;
  sourceCodes?: string[] | undefined;
  isDemoFictional?: boolean | undefined;
  demoLabel?: string | undefined;
  reviewLabel?: string | undefined;
  accessLabel?: string | undefined;
  sourcesLabel?: string | undefined;
};

/** Provenance / review / access strip for cultural descriptions and catalogue rows. */
export function ProvenanceStrip({
  reviewStatus,
  accessTier,
  sourceCodes = [],
  isDemoFictional,
  demoLabel = 'DEMO / FICTIONAL — NOT RESEARCH DATA',
  reviewLabel = 'Review',
  accessLabel = 'Access',
  sourcesLabel = 'Sources',
}: ProvenanceStripProps) {
  return (
    <div
      className="provenance-strip"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        margin: '0.75rem 0',
        padding: '0.65rem 0',
        borderTop: '1px solid var(--bcip-border)',
        borderBottom: '1px solid var(--bcip-border)',
      }}
    >
      {isDemoFictional ? <StatusBadge tone="demo">{demoLabel}</StatusBadge> : null}
      {reviewStatus ? (
        <StatusBadge tone="review" label={reviewLabel}>
          {reviewStatus.replaceAll('_', ' ')}
        </StatusBadge>
      ) : null}
      {accessTier ? (
        <StatusBadge tone="access" label={accessLabel}>
          {accessTier.replaceAll('_', ' ')}
        </StatusBadge>
      ) : null}
      {sourceCodes.length > 0 ? (
        <StatusBadge tone="neutral" label={sourcesLabel}>
          {sourceCodes.join(' · ')}
        </StatusBadge>
      ) : null}
    </div>
  );
}

export type FilterBarField = {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'checkbox';
  defaultValue?: string;
  checked?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

/** GET filter form for Motif Explorer — heritage-styled, no dashboard chrome. */
export function FilterBar({
  action = '/explore',
  fields,
  submitLabel = 'Apply',
  children,
}: PropsWithChildren<{
  action?: string;
  fields: FilterBarField[];
  submitLabel?: string;
}>) {
  return (
    <form
      method="get"
      action={action}
      className="filter-bar"
      style={{
        display: 'grid',
        gap: '0.85rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
        alignItems: 'end',
        padding: '1rem 0 1rem 1rem',
        borderLeft: '3px solid var(--bcip-clay)',
        margin: '1.25rem 0',
      }}
    >
      {fields.map((field) => {
        if (field.type === 'checkbox') {
          return (
            <label
              key={field.name}
              style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.9rem' }}
            >
              <input type="checkbox" name={field.name} value="true" defaultChecked={field.checked} />
              {field.label}
            </label>
          );
        }
        if (field.type === 'select') {
          return (
            <label key={field.name} style={{ display: 'grid', gap: 4, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--bcip-muted)' }}>{field.label}</span>
              <select
                name={field.name}
                defaultValue={field.defaultValue ?? ''}
                style={{
                  font: 'inherit',
                  padding: '0.4rem 0.5rem',
                  border: '1px solid var(--bcip-border)',
                  background: 'rgba(255,255,255,0.55)',
                }}
              >
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value || '__all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <label key={field.name} style={{ display: 'grid', gap: 4, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--bcip-muted)' }}>{field.label}</span>
            <input
              type="text"
              name={field.name}
              defaultValue={field.defaultValue ?? ''}
              placeholder={field.placeholder}
              style={{
                font: 'inherit',
                padding: '0.4rem 0.5rem',
                border: '1px solid var(--bcip-border)',
                background: 'rgba(255,255,255,0.55)',
              }}
            />
          </label>
        );
      })}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button type="submit">{submitLabel}</Button>
        {children}
      </div>
    </form>
  );
}
