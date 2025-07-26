'use client';

import { cn } from '@/lib/utils';

interface OrbitalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-4xl'
};

export default function OrbitalLogo({ 
  size = 'md', 
  variant = 'full', 
  animated = true,
  className 
}: OrbitalLogoProps) {
  const OrbitIcon = () => (
    <div className={cn(
      "relative flex items-center justify-center",
      sizeClasses[size],
      animated && "animate-orbital-pulse"
    )}>
      {/* Órbita Circular */}
      <svg 
        viewBox="0 0 48 48" 
        className="w-full h-full"
        fill="none"
      >
        {/* Círculo Principal da Órbita */}
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="url(#orbitalGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 4"
          className={animated ? "animate-orbital-spin" : ""}
          style={{ transformOrigin: '24px 24px' }}
        />
        
        {/* Seta/Chevron formando o "D" */}
        <path
          d="M28 16 L36 24 L28 32 L26 30 L32 24 L26 18 Z"
          fill="url(#orbitalGradient)"
          className="drop-shadow-sm"
        />
        
        {/* Ponto Central */}
        <circle
          cx="24"
          cy="24"
          r="2"
          fill="url(#orbitalGradient)"
          className={animated ? "animate-glow-pulse" : ""}
        />
        
        {/* Gradiente Definitions */}
        <defs>
          <linearGradient id="orbitalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2162FF" />
            <stop offset="100%" stopColor="#0E1A59" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );

  const LogoText = () => (
    <span className={cn(
      "font-orbital font-bold text-gradient-orbital",
      textSizeClasses[size]
    )}>
      OrbDrive
    </span>
  );

  if (variant === 'icon') {
    return (
      <div className={className}>
        <OrbitIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={className}>
        <LogoText />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center space-x-3",
      className
    )}>
      <OrbitIcon />
      <LogoText />
    </div>
  );
} 