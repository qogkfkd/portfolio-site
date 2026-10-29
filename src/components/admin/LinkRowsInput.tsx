import { LINK_KINDS, LINK_KIND_LABELS, type LinkKind } from "../../lib/types";

interface Row {
  kind?: LinkKind;
  label: string;
  url: string;
}

interface Props<T extends Row> {
  id: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  makeEmpty: () => T;
  withKind: boolean;
  errors: Record<string, string>;
  max: number;
}

export default function LinkRowsInput<T extends Row>({ id, rows, onChange, makeEmpty, withKind, errors, max }: Props<T>) {
  const update = (index: number, patch: Partial<Row>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="link-rows">
      {rows.map((row, index) => {
        const error = errors[`links.${index}`];
        return (
          <div className={withKind ? "link-row" : "link-row no-kind"} key={index}>
            {withKind && (
              <select
                aria-label="링크 종류"
                value={row.kind ?? "github"}
                onChange={(event) => update(index, { kind: event.target.value as LinkKind })}
                className="field-select"
              >
                {LINK_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {LINK_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              aria-label="링크 이름"
              placeholder={withKind ? "이름 (비우면 종류 이름)" : "이름 (예: 블로그)"}
              value={row.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
            <input
              type="url"
              aria-label="링크 주소"
              placeholder="https://"
              value={row.url}
              aria-invalid={error ? true : undefined}
              onChange={(event) => update(index, { url: event.target.value })}
            />
            <button type="button" className="btn btn-small" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              빼기
            </button>
            {error && <p className="field-error">{error}</p>}
          </div>
        );
      })}
      {rows.length < max && (
        <div>
          <button type="button" className="btn btn-small" id={id} onClick={() => onChange([...rows, makeEmpty()])}>
            링크 추가
          </button>
        </div>
      )}
      {errors.links && <p className="field-error">{errors.links}</p>}
    </div>
  );
}
