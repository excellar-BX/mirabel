import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { cx } from "./ui";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cx("inline-flex items-center rounded-lg bg-surface-2 border border-line p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className={cx(
            "h-7 flex-1 px-2 rounded-md flex items-center justify-center transition-colors",
            theme === value ? "bg-surface text-fg shadow-xs" : "text-subtle hover:text-fg"
          )}
        >
          <Icon size={14} />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
