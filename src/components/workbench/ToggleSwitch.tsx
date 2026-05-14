import { useId } from 'react';
import './workbench.css';

type ToggleSwitchProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  helperText?: string;
  onChange: (checked: boolean) => void;
};

export function ToggleSwitch({
  label,
  checked,
  disabled = false,
  helperText,
  onChange,
}: ToggleSwitchProps) {
  const helperId = useId();

  return (
    <label className={`workbench-toggle ${disabled ? 'is-disabled' : ''}`}>
      <span className="workbench-toggle__copy">
        <span className="workbench-toggle__label">{label}</span>
        {helperText ? <span className="workbench-toggle__helper" id={helperId}>{helperText}</span> : null}
      </span>
      <input
        className="workbench-toggle__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={helperText ? helperId : undefined}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="workbench-toggle__control" aria-hidden="true">
        <span className="workbench-toggle__thumb" />
      </span>
    </label>
  );
}
