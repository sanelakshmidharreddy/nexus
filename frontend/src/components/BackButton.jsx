import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

/**
 * Reusable Global Back Button for NEXUS Command Center.
 * Returns to the actual previous page or safe fallback.
 */
export default function BackButton({
  label = 'Back',
  onClick = null,
  fallbackTab = 'overview',
  className = '',
  style = {},
  ariaLabel = null,
  showLabel = true,
  size = 'medium', // 'small' | 'medium'
}) {
  const { goBack, previousState, getViewTitle } = useNavigation();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    } else {
      goBack(fallbackTab);
    }
  };

  const isSmall = size === 'small';
  const computedAriaLabel =
    ariaLabel ||
    (previousState
      ? `Go back to ${getViewTitle(previousState.tab, previousState.agentId)}`
      : 'Go back to previous page');

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={computedAriaLabel}
      className={`nexus-back-button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '5px' : '7px',
        padding: isSmall ? '4px 10px' : '6px 14px',
        fontSize: isSmall ? '0.74rem' : '0.8rem',
        fontWeight: '600',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)',
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm, 6px)',
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'var(--shadow-xs)',
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface-secondary)';
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.transform = 'translateX(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#ffffff';
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.outline = '2px solid rgba(15, 23, 42, 0.15)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.outline = 'none';
      }}
    >
      <ArrowLeft size={isSmall ? 13 : 15} style={{ flexShrink: 0, transition: 'transform 180ms ease' }} />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
