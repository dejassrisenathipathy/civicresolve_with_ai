import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

/**
 * Accessible button component complying with WCAG AA contrast
 * and visible focus state requirements.
 */
export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps): JSX.Element {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg px-6 py-3 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg min-h-[48px]';

  const variantStyles =
    variant === 'primary'
      ? 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300 active:bg-blue-900 border border-transparent'
      : 'bg-white text-gray-900 hover:bg-gray-100 focus:ring-gray-300 active:bg-gray-200 border-2 border-gray-400';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
