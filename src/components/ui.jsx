/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, User } from "lucide-react";
import { photoUrl } from "../lib/axios";
import { initials } from "../lib/format";

export const cx = (...c) => c.filter(Boolean).join(" ");

/* ─────────────── Button ─────────────── */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-lg transition-colors " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-xs",
  secondary: "bg-surface text-fg border border-line hover:bg-surface-2 shadow-xs",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90 shadow-xs",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  success: "bg-success text-white hover:opacity-90 shadow-xs",
};

const BUTTON_SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
};

export function buttonClass({ variant = "secondary", size = "md", className } = {}) {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export const Button = forwardRef(function Button(
  { variant, size, className, loading, icon: Icon, children, disabled, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "lg" ? 17 : 15} strokeWidth={2} />
      )}
      {children}
    </button>
  );
});

export function ButtonLink({ to, variant, size, className, icon: Icon, children }) {
  return (
    <Link to={to} className={buttonClass({ variant, size, className })}>
      {Icon && <Icon size={15} />}
      {children}
    </Link>
  );
}

/* ─────────────── Form controls ─────────────── */

// Full width unless the caller sets its own width.
const control = (className) => cx(CONTROL, !/(^|\s)(\w+:)?w-/.test(className || "") && "w-full", className);

const CONTROL =
  "h-9 rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-subtle " +
  "shadow-xs transition-[border-color,box-shadow] outline-none " +
  "hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-[var(--ring)] " +
  "disabled:opacity-60";

export const Input = forwardRef(function Input({ className, icon: Icon, ...props }, ref) {
  if (!Icon) return <input ref={ref} className={control(className)} {...props} />;
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
      <input ref={ref} className={cx(control(className), "pl-9")} {...props} />
    </div>
  );
});

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(control(className), "pr-8 cursor-pointer appearance-none bg-no-repeat")}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b919c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.6rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cx("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  );
}

/* ─────────────── Segmented control ─────────────── */

export function Segmented({ options, value, onChange, size = "md", className }) {
  return (
    <div
      role="tablist"
      className={cx("inline-flex items-center rounded-lg bg-surface-2 p-0.5 border border-line", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-md font-medium transition-colors whitespace-nowrap",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── Surfaces ─────────────── */

export function Card({ className, children, ...props }) {
  return (
    <div className={cx("bg-surface border border-line rounded-xl shadow-xs", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 px-5 pt-4 pb-3", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="text-[13px] text-muted mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[22px] leading-7 font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ─────────────── Badges ─────────────── */

const BADGE_TONES = {
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-success-soft text-success border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
};

export function Badge({ tone = "neutral", dot, children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md border text-xs font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return status === "active" ? (
    <Badge tone="success" dot>Active</Badge>
  ) : (
    <Badge tone="danger" dot>Revoked</Badge>
  );
}

export function TypeBadge({ type }) {
  if (!type) return <Badge>Unknown</Badge>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg">
      <span
        className={cx("w-2 h-2 rounded-sm", type === "staff" ? "bg-series-1" : "bg-series-2")}
        aria-hidden
      />
      {type === "staff" ? "Staff" : "Visitor"}
    </span>
  );
}

/* ─────────────── Avatar ─────────────── */

const AVATAR_SIZES = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-28 h-28 text-2xl",
};

export function Avatar({ person, src, size = "md", className, square }) {
  const url = src || photoUrl(person);
  const [failedUrl, setFailedUrl] = useState(null);
  const showImg = url && failedUrl !== url;
  const text = initials(person?.name);
  return (
    <div
      className={cx(
        "shrink-0 overflow-hidden flex items-center justify-center bg-surface-3 text-muted font-semibold",
        square ? "rounded-lg" : "rounded-full",
        AVATAR_SIZES[size],
        className
      )}
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : text ? (
        text
      ) : (
        <User size={16} />
      )}
    </div>
  );
}

/* ─────────────── Feedback ─────────────── */

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-md bg-surface-3", className)} />;
}

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cx("animate-spin text-subtle", className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {Icon && (
        <div className="w-11 h-11 rounded-xl border border-line bg-surface-2 flex items-center justify-center mb-4">
          <Icon size={20} className="text-subtle" />
        </div>
      )}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="text-[13px] text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const ALERT_TONES = {
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-accent-soft text-accent",
};

export function Alert({ tone = "danger", icon: Icon, children, className }) {
  return (
    <div className={cx("flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[13px] font-medium", ALERT_TONES[tone], className)}>
      {Icon && <Icon size={16} className="shrink-0 mt-px" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ─────────────── Drawer ─────────────── */

export function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-surface border-l border-line shadow-pop flex flex-col animate-slide-in-right"
      >
        {children}
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

/* ─────────────── Key/value list ─────────────── */

export function DetailList({ items }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-6 py-2.5 text-[13px]">
          <dt className="text-muted shrink-0">{k}</dt>
          <dd className="text-fg text-right min-w-0 break-words">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
