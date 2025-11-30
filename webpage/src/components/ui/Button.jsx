// src/components/ui/Button.jsx
import React from 'react';

/**
 * A reusable Button that supports:
 * - `variant`: "primary" | "secondary"
 * - `isLoading`: show bouncing‐dots spinner
 * - `disabled`
 * - merges any extra `className` passed in
 */
export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || isLoading;

  // Tailwind classes for your custom colors
  const variantClasses =
    variant === 'primary'
      ? 'bg-primary hover:bg-secondary text-white'
      : 'bg-secondary hover:bg-primary text-white';

  const baseClasses = [
    'flex items-center justify-center',
    'px-4 py-2 rounded font-semibold focus:outline-none',
    variantClasses,
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={baseClasses}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex space-x-1">
          <span className="dot text-white text-xl">.</span>
          <span className="dot text-white text-xl">.</span>
          <span className="dot text-white text-xl">.</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
