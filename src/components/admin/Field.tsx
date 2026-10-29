import type { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  required?: boolean;
  help?: ReactNode;
  error?: string;
  children: ReactNode;
}

export default function Field({ id, label, required = false, help, error, children }: Props) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      {children}
      {help && <p className="field-help">{help}</p>}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
