import { BRAND } from "../lib/brand";

export function LogoMark({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M9 22V10.5l7 7.5 7-7.5V22" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ subtitle = BRAND.product }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <LogoMark />
      <div className="leading-tight min-w-0">
        <p className="text-[14px] font-semibold text-fg tracking-tight">{BRAND.name}</p>
        {subtitle && <p className="text-[11px] text-subtle truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
