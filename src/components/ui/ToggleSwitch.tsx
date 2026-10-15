import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  size = 'md',
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center gap-3 select-none transition-opacity ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] ${
          size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'
        } ${
          checked
            ? 'bg-cyan-500 shadow-sm shadow-cyan-500/40'
            : 'bg-slate-300 dark:bg-slate-700/80 border border-[var(--border-subtle)]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
            size === 'sm' ? 'h-3 w-3 mt-0.5' : 'h-3.5 w-3.5 mt-[3px]'
          } ${
            checked
              ? size === 'sm'
                ? 'translate-x-3.5'
                : 'translate-x-4.5'
              : 'translate-x-0.5'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
