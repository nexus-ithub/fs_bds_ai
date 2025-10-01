import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'bggray' | 'outlinegray';
  size?: 'default' | 'medium' | 'small';
  fontSize?: string;
}

export function Button({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  fontSize = 'font-h6',
  ...props
}: ButtonProps) {
  const baseStyles = `text-center rounded-[2px] ${fontSize} inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-surface-fourth disabled:text-text-4 disabled:outline-line-3`;
  
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    default: 'bg-primary text-white hover:bg-primary/90',
    outline: 'border border-[1px] border-primary text-primary',
    outlinegray: 'border border-[1px] border-line-03 text-text-03',
    bggray: 'bg-surface-third',
  };
  

  const sizes = {
    default: 'py-[8px] px-[12px]',
    medium: 'py-[14px] px-[12px]',
    small: 'py-[4px] px-[10px]',
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
