type IconProps = { size?: number; className?: string };

const base = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const OvenIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <rect x="7" y="4" width="50" height="56" rx="4" />
    <line x1="20" y1="18" x2="44" y2="18" />
    <rect x="13" y="22" width="38" height="30" rx="3" />
    <circle cx="20" cy="11" r="3" />
    <circle cx="32" cy="11" r="3" />
    <circle cx="44" cy="11" r="3" />
    <line x1="16" y1="60" x2="14" y2="64" />
    <line x1="48" y1="60" x2="50" y2="64" />
  </svg>
);

export const MicrowaveIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <rect x="3" y="12" width="58" height="40" rx="4" />
    <rect x="7" y="17" width="33" height="30" rx="3" />
    <line x1="44" y1="12" x2="44" y2="52" />
    <circle cx="53" cy="26" r="4" />
    <rect x="48" y="35" width="10" height="4" rx="2" />
    <rect x="48" y="43" width="10" height="4" rx="2" />
  </svg>
);

export const StovetopIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <rect x="3" y="3" width="58" height="58" rx="5" />
    <circle cx="18" cy="19" r="9" />
    <circle cx="46" cy="19" r="9" />
    <circle cx="18" cy="45" r="9" />
    <circle cx="46" cy="45" r="9" />
    <line x1="54" y1="16" x2="59" y2="16" />
    <line x1="54" y1="32" x2="59" y2="32" />
    <line x1="54" y1="48" x2="59" y2="48" />
  </svg>
);

export const AirFryerIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <path d="M10 16 Q10 6 32 6 Q54 6 54 16 L54 56 Q54 60 50 60 L14 60 Q10 60 10 56 Z" />
    <circle cx="32" cy="26" r="11" />
    <circle cx="32" cy="26" r="5" />
    <rect x="15" y="46" width="34" height="10" rx="4" />
    <line x1="27" y1="51" x2="37" y2="51" />
  </svg>
);

export const BlenderIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <path d="M18 8 L13 46 Q13 50 17 50 L47 50 Q51 50 51 46 L46 8 Z" />
    <line x1="16" y1="8" x2="48" y2="8" />
    <rect x="22" y="3" width="20" height="6" rx="3" />
    <rect x="10" y="50" width="44" height="12" rx="5" />
    <line x1="17" y1="30" x2="47" y2="26" />
    <line x1="15" y1="38" x2="49" y2="35" />
  </svg>
);

export const SlowCookerIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <path d="M10 28 Q10 58 32 58 Q54 58 54 28 Z" />
    <path d="M10 28 Q10 16 32 16 Q54 16 54 28" />
    <path d="M14 24 Q14 10 32 10 Q50 10 50 24" />
    <circle cx="32" cy="7" r="3" />
    <circle cx="32" cy="42" r="9" />
    <circle cx="32" cy="42" r="4" />
    <line x1="4" y1="38" x2="10" y2="38" />
    <line x1="54" y1="38" x2="60" y2="38" />
  </svg>
);

export const DeepFryerIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <rect x="10" y="20" width="44" height="36" rx="4" />
    <line x1="21" y1="20" x2="21" y2="56" />
    <line x1="32" y1="20" x2="32" y2="56" />
    <line x1="43" y1="20" x2="43" y2="56" />
    <line x1="10" y1="29" x2="54" y2="29" />
    <line x1="10" y1="38" x2="54" y2="38" />
    <line x1="10" y1="47" x2="54" y2="47" />
    <line x1="24" y1="12" x2="40" y2="12" />
    <line x1="32" y1="12" x2="32" y2="20" />
  </svg>
);

export const SteamerIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <rect x="8" y="40" width="48" height="20" rx="5" />
    <rect x="5" y="27" width="54" height="14" rx="4" />
    <path d="M10 27 Q32 12 54 27" />
    <line x1="4" y1="50" x2="8" y2="50" />
    <line x1="56" y1="50" x2="60" y2="50" />
    <path d="M22 20 Q20 14 22 8" />
    <path d="M32 18 Q30 12 32 6" />
    <path d="M42 20 Q40 14 42 8" />
  </svg>
);

export const BarbecueIcon = ({ size = 48, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" {...base} className={className}>
    <path d="M8 30 Q8 8 32 8 Q56 8 56 30 Z" />
    <line x1="6" y1="30" x2="58" y2="30" />
    <line x1="16" y1="30" x2="12" y2="56" />
    <line x1="48" y1="30" x2="52" y2="56" />
    <line x1="32" y1="30" x2="32" y2="52" />
    <line x1="13" y1="48" x2="51" y2="48" />
    <line x1="20" y1="22" x2="44" y2="22" />
    <line x1="14" y1="26" x2="50" y2="26" />
    <circle cx="32" cy="6" r="2" />
  </svg>
);

export const EQUIPMENT_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  oven: OvenIcon,
  microwave: MicrowaveIcon,
  stovetop: StovetopIcon,
  air_fryer: AirFryerIcon,
  blender: BlenderIcon,
  slow_cooker: SlowCookerIcon,
  deep_fryer: DeepFryerIcon,
  steamer: SteamerIcon,
  barbecue: BarbecueIcon,
};
