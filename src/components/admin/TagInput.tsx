import { useState, type KeyboardEvent } from "react";

interface Props {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder: string;
  invalid?: boolean;
}

export default function TagInput({ id, values, onChange, suggestions, placeholder, invalid = false }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.replace(/,/g, "").trim();
    setDraft("");
    if (value !== "" && !values.includes(value)) onChange([...values, value]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="tag-input" aria-invalid={invalid || undefined}>
      {values.map((value) => (
        <span className="chip" key={value}>
          {value}
          <button type="button" aria-label={`${value} 지우기`} onClick={() => onChange(values.filter((v) => v !== value))}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        list={`${id}-suggestions`}
        placeholder={values.length === 0 ? placeholder : ""}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
      />
      <datalist id={`${id}-suggestions`}>
        {suggestions
          .filter((suggestion) => !values.includes(suggestion))
          .map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
    </div>
  );
}
