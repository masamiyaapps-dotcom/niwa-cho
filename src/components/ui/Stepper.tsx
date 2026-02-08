interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
}

export function Stepper({
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
  label,
}: StepperProps) {
  const decrement = () => {
    const next = value - step;
    if (next >= min) onChange(next);
  };

  const increment = () => {
    const next = value + step;
    if (next <= max) onChange(next);
  };

  return (
    <div className="stepper">
      {label && <span className="stepper-label">{label}</span>}
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn stepper-btn--minus"
          onClick={decrement}
          disabled={value <= min}
          aria-label="減らす"
        >
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button
          type="button"
          className="stepper-btn stepper-btn--plus"
          onClick={increment}
          disabled={value >= max}
          aria-label="増やす"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

