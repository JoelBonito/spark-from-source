import { cn } from "@/lib/utils";
import logoImage from "@/assets/trusmile-logo-horizontal.png";
import iconImage from "@/assets/trusmile-icon.svg";

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  width?: number;
  className?: string;
}

export function Logo({ variant = 'full', width, className }: LogoProps) {
  const defaultWidth = variant === 'icon' ? 40 : variant === 'compact' ? 120 : 160;
  const logoWidth = width || defaultWidth;
  const imageSrc = variant === 'icon' ? iconImage : logoImage;

  return (
    <img
      src={imageSrc}
      alt="TruSmile AI - Análise Inteligente do Sorriso"
      width={logoWidth}
      className={cn(
        "h-auto object-contain transition-all duration-300",
        className
      )}
    />
  );
}
