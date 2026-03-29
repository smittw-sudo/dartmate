import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-95 select-none touch-manipulation';

  const variants = {
    primary: 'bg-accent text-black hover:bg-accent-dim active:bg-accent-dim',
    secondary: 'bg-surface2 text-text-primary hover:bg-inactive',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface2',
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm min-w-[40px]',
    md: 'h-12 px-5 text-base min-w-[48px]',
    lg: 'h-14 px-6 text-lg min-w-[56px]',
    xl: 'h-16 px-8 text-xl min-w-[64px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
