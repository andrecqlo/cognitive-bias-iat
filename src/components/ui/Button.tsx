import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center rounded-[4px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 no-select';

const VARIANTS: Record<Variant, string> = {
  primary: 'min-h-14 px-7 py-4 text-lg bg-ink text-white hover:bg-ink-soft',
  secondary: 'min-h-14 px-7 py-4 text-lg bg-surface text-ink border border-line hover:bg-zone',
  quiet: 'min-h-11 px-3 py-2 text-base text-muted underline decoration-line underline-offset-4 hover:text-ink',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
