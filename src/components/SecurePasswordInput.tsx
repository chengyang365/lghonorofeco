import React from 'react';

interface SecurePasswordInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  theme?: 'emerald' | 'rose';
}

export const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  value,
  onChange,
  placeholder = "••••••••",
  autoFocus = false,
  theme = 'emerald'
}) => {
  const isEmerald = theme === 'emerald';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    onChange(val);
  };

  return (
    <div
      className={`relative w-full h-12.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl transition-all flex items-center justify-center overflow-hidden ${
        isEmerald
          ? 'focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-950/40'
          : 'focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100 dark:focus-within:ring-rose-950/40'
      }`}
    >
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
        autoComplete="off"
        autoFocus={autoFocus}
      />
      <div className="flex gap-2.5 pointer-events-none z-10">
        {value.length > 0 ? (
          value.split('').map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full animate-fade-in ${
                isEmerald ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
              }`}
            ></div>
          ))
        ) : (
          <span className="text-stone-300 dark:text-stone-700 text-sm tracking-wider font-mono">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
};
