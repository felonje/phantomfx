type P = { className?: string };

const base = (d: React.ReactNode, className = "h-5 w-5") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {d}
  </svg>
);

export const IconChart = ({ className }: P) => base(<><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>, className);
export const IconWallet = ({ className }: P) =>
  base(<><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" /><circle cx="16" cy="14.5" r="1.2" /></>, className);
export const IconHistory = ({ className }: P) => base(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>, className);
export const IconShield = ({ className }: P) => base(<><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>, className);
export const IconBolt = ({ className }: P) => base(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />, className);
export const IconLayers = ({ className }: P) => base(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>, className);
export const IconPulse = ({ className }: P) => base(<path d="M3 12h4l3-8 4 16 3-8h4" />, className);
export const IconReceipt = ({ className }: P) => base(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>, className);
export const IconList = ({ className }: P) => base(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>, className);
export const IconSwap = ({ className }: P) => base(<><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></>, className);
export const IconBriefcase = ({ className }: P) =>
  base(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>, className);
export const IconLogout = ({ className }: P) => base(<><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></>, className);
export const IconCheck = ({ className }: P) => base(<path d="m5 12 5 5L20 7" />, className);
export const IconArrowRight = ({ className }: P) => base(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, className);
export const IconUser = ({ className }: P) => base(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>, className);
