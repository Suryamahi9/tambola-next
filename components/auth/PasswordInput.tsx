"use client";

import { useState } from "react";

interface PasswordInputProps {
  id: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  required,
  minLength,
  value,
  onChange,
  className = "",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 pr-11 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 transition hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[1.25rem] leading-none">
          {show ? "visibility" : "visibility_off"}
        </span>
      </button>
    </div>
  );
}