import { InputHTMLAttributes, useId, useState } from 'react';
import styles from './TextField.module.css';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  /** Mostra botão de olho para alternar visibilidade (só com `type="password"`). */
  passwordToggle?: boolean;
};

function IconEye() {
  return (
    <svg className={styles.toggleIcon} viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9a3 3 0 100 6 3 3 0 000-6z"
      />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg className={styles.toggleIcon} viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M3 3l18 18"
      />
    </svg>
  );
}

export function TextField({
  label,
  hint,
  error,
  passwordToggle,
  id,
  className = '',
  ...inputProps
}: TextFieldProps) {
  const genId = useId();
  const inputId = id ?? genId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const { type: typeProp = 'text', disabled, ...restInput } = inputProps;
  const showPasswordToggle = Boolean(passwordToggle && typeProp === 'password');
  const [visible, setVisible] = useState(false);
  const inputType = showPasswordToggle ? (visible ? 'text' : 'password') : typeProp;

  const inputClassName = [
    styles.input,
    error ? styles.inputError : '',
    showPasswordToggle ? styles.inputWithToggle : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputEl = (
    <input
      id={inputId}
      className={inputClassName}
      type={inputType}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={
        [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(' ') || undefined
      }
      {...restInput}
    />
  );

  return (
    <div className={styles.root}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {showPasswordToggle ? (
        <div className={styles.inputWrap}>
          {inputEl}
          <button
            type="button"
            className={styles.toggle}
            disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      ) : (
        inputEl
      )}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
