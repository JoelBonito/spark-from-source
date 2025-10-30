import { cn } from "@/lib/utils";
import logoImage from "@/assets/trusmile-logo-horizontal.png";

interface LogoProps {
  variant?: 'full' | 'compact';
  width?: number;
  className?: string;
}

export function Logo({ variant = 'full', width, className }: LogoProps) {
  const defaultWidth = variant === 'compact' ? 120 : 160;
  const logoWidth = width || defaultWidth;

  return (
    <img
      src={logoImage}
      alt="TruSmile AI - Análise Inteligente do Sorriso"
      width={logoWidth}
      className={cn(
        "h-auto object-contain transition-all duration-300",
        className
      )}
    />
  );
}
