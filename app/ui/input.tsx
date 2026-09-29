'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Gộp label + input + lỗi field vào 1 component - form nào cũng lặp lại 3 phần
// này, tách ra đỡ phải viết tay <label>+<input>+lỗi ở từng chỗ.
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-ink">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
