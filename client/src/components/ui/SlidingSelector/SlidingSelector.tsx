import { useRef, useEffect, useState, useCallback } from 'react';

type Option<T extends string | number> = {
  value: T;
  label: React.ReactNode;
};

type SlidingSelectorProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
};

function SlidingSelector<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  buttonClassName = 'px-4 py-3 font-medium text-text-primary',
}: SlidingSelectorProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const updateIndicator = useCallback(() => {
    const button = buttonRefs.current.get(value);
    const container = containerRef.current;
    if (button && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div ref={containerRef} className={`relative flex ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          ref={(el) => {
            if (el) buttonRefs.current.set(option.value, el);
          }}
          onClick={() => onChange(option.value)}
          className={`relative z-10 border-2 border-transparent rounded-xl hover:border-primary-300 hover:cursor-pointer transition-colors ${buttonClassName}`}
          type="button"
        >
          {option.label}
        </button>
      ))}
      {indicatorStyle.width > 0 && (
        <div
          className={`absolute top-0 h-full border-2 border-primary-500 rounded-xl pointer-events-none ${shouldAnimate ? 'transition-all duration-200 ease-out' : ''}`}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
    </div>
  );
}

export default SlidingSelector;
