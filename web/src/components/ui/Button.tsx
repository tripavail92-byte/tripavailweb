'use client';

import React from 'react';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  className = '',
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseStyles =
    'rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap';
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyle}
        ${disabledStyle}
        ${className}
      `}
    >
      {loading ? <LoadingSpinner /> : icon}
      {label}
    </button>
  );
}

function LoadingSpinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
