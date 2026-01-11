import { forwardRef } from 'react';

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, disabled = false, onCheckedChange }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        className="switch-root"
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        <span className="switch-thumb" data-state={checked ? 'checked' : 'unchecked'} />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
