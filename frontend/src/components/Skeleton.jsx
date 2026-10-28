import React from 'react';

export const CardSkeleton = () => {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <div className="skeleton" style={{ width: '45%', height: '14px' }} />
          <div className="skeleton" style={{ width: '25%', height: '10px' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: '16px' }} />
      <div className="skeleton" style={{ width: '85%', height: '16px' }} />
      <div className="skeleton" style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-md)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
        <div className="skeleton" style={{ width: '60px', height: '24px' }} />
        <div className="skeleton" style={{ width: '60px', height: '24px' }} />
      </div>
    </div>
  );
};

export const ListSkeleton = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};
