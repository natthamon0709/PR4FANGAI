interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function AppLogo({ 
  size = 'md', 
  showSubtitle = true, 
  variant = 'light',
  className = '' 
}: AppLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official College Logo Seal */}
      <div className={`${iconSizes[size]} rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-card flex-shrink-0 border border-secondary/30 ring-2 ${isDark ? 'ring-amber-400/40 shadow-glow-gold/20' : 'ring-primary/15'} transition-transform duration-200 hover:scale-105`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/logofve.png"
          alt="วิทยาลัยการอาชีพฝาง"
          className="w-full h-full object-contain filter drop-shadow-xs"
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-heading tracking-tight font-extrabold ${titleSizes[size]} ${isDark ? 'text-white' : 'text-primary'}`}>
            PR4Fang
          </span>
          <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider shadow-xs ring-1 ring-amber-400/30">
            AI
          </span>
        </div>
        {showSubtitle && (
          <p className={`text-[11px] truncate font-medium mt-1 leading-tight ${isDark ? 'text-amber-200/90' : 'text-onSurface-muted'}`}>
            วิทยาลัยการอาชีพฝาง
          </p>
        )}
      </div>
    </div>
  );
}
