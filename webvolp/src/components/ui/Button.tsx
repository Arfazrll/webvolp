import React from 'react';
import { type ClassValue, clsx } from 'clsx';

// Implementasi fungsi twMerge sederhana karena tidak bisa mengimpor tailwind-merge
function twMerge(...classNames: string[]): string {
  return classNames.filter(Boolean).join(' ');
}

// Implementasi cn tanpa tailwind-merge
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | 'icon-xl';
  roundness?: 'default' | 'full';
  // Menghapus asChild yang tidak digunakan
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', roundness = 'default', ...props }, ref) => {
    // Konstruksi class berdasarkan variant, size, dan roundness
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    // Styles untuk variants
    const variantStyles: Record<string, string> = {
      default: "bg-primary-600 text-white hover:bg-primary-700",
      secondary: "bg-secondary-200 text-secondary-900 hover:bg-secondary-300",
      outline: "border border-input bg-transparent hover:bg-secondary-100",
      ghost: "hover:bg-secondary-100 hover:text-secondary-900",
      link: "text-primary-600 underline-offset-4 hover:underline",
      destructive: "bg-red-600 text-white hover:bg-red-700"
    };
    
    // Styles untuk sizes
    const sizeStyles: Record<string, string> = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10",
      'icon-sm': "h-8 w-8",
      'icon-lg': "h-12 w-12",
      'icon-xl': "h-16 w-16 text-xl",
    };
    
    // Styles untuk roundness
    const roundnessStyles: Record<string, string> = {
      default: "rounded-md",
      full: "rounded-full",
    };
    
    const buttonStyle = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      roundnessStyles[roundness],
      className || ''
    );

    return (
      <button
        className={buttonStyle}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };