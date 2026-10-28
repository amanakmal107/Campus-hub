import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '50px 24px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--border-strong)',
        margin: '20px 0',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Icon size={32} />
        </div>
      )}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', marginBottom: '20px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
