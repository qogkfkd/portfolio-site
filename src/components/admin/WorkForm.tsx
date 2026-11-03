import { useState } from "react";
import { DEV_METHOD_LABELS, type WorkLink } from "../../lib/types";
import { charCount } from "../../lib/validate/common";
import { LINKS_MAX, validateWorkInput, type WorkInput } from "../../lib/validate/work";
import { SUMMARY_MAX } from "../../lib/works/summary";
import { failureMessage, sendJson } from "./api";
import { withoutError } from "./errors";
import Field from "./Field";
import LinkRowsInput from "./LinkRowsInput";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

interface Props {
  mode: "create" | "edit";
  workId: string | null;
  initial: WorkInput;
  suggestions: { fields: string[]; techs: string[] };
  savedNotice?: boolean;
}

type Notice = { kind: "success" | "error"; text: string } | null;

export default function WorkForm({ mode, workId, initial, suggestions, savedNotice = false }: Props) {
  const [values, setValues] = useState<WorkInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(savedNotice ? { kind: "success", text: "저장했어요." } : null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const allowLeave = useUnsavedWarning(dirty);

  const set = <K extends keyof WorkInput>(key: K, value: WorkInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => withoutError(withoutError(current, key), key === "teamType" ? "teamSize" : key));
  };

  const showErrors = (next: Record<string, string>) => {
    setErrors(next);
    setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const check = validateWorkInput(values);
    if (!check.ok) {
      showErrors(check.errors);
      return;
    }
    setSaving(true);
    setNotice(null);
    const result =
      mode === "create"
        ? await sendJson("POST", "/api/admin/works", values)
        : await sendJson("PUT", `/api/admin/works/${workId}`, values);
    setSaving(false);
    if (result.ok && result.data?.id) {
      setErrors({});
      setDirty(false);
      if (mode === "create") {
        allowLeave();
        window.location.assign(`/admin/works/${result.data.id}/edit?saved=1`);
        return;
      }
      setValues((current) => ({ ...current, slug: result.data?.slug ?? current.slug }));
      setNotice({ kind: "success", text: "저장했어요." });
      return;
    }
    if (result.status === 400 && result.data?.errors) showErrors(result.data.errors);
    else setNotice({ kind: "error", text: failureMessage(result) });
  }

  const invalid = (key: string) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={submit} noValidate>
      {notice && (
        <p className={`alert ${notice.kind === "success" ? "alert-success" : "alert-error"}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      )}
      {mode === "create" && (
        <p className="admin-muted" style={{ marginBottom: 20 }}>
          새 작품은 비공개로 저장돼요. 저장하면 파일을 올릴 수 있어요.
        </p>
      )}

      <section className="form-section">
        <h2>기본 정보</h2>
        <Field id="title" label="작품명" required error={errors.title}>
          <input id="title" type="text" value={values.title} aria-invalid={invalid("title")} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field id="fields" label="작업한 분야" required help="Enter나 쉼표로 하나씩 넣어요. 예: 개발, 디자인, 기획" error={errors.fields}>
          <TagInput id="fields" values={values.fields} onChange={(v) => set("fields", v)} suggestions={suggestions.fields} placeholder="분야 입력" invalid={Boolean(errors.fields)} />
        </Field>
        <Field id="summary" label="한 줄 요약" help={`${charCount(values.summary)}/${SUMMARY_MAX}자 · 비워 두면 설명 앞부분을 써요.`} error={errors.summary}>
          <input id="summary" type="text" value={values.summary} aria-invalid={invalid("summary")} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <Field id="description" label="작품 설명" required error={errors.descriptionHtml}>
          <RichTextEditor id="description" value={values.descriptionHtml} onChange={(html) => set("descriptionHtml", html)} invalid={Boolean(errors.descriptionHtml)} />
        </Field>
      </section>

      <section className="form-section">
        <h2>대회와 기간</h2>
        <div className="form-grid">
          <Field id="competition" label="참가한 대회" error={errors.competition}>
            <input id="competition" type="text" value={values.competition} aria-invalid={invalid("competition")} onChange={(e) => set("competition", e.target.value)} />
          </Field>
          <Field id="organizer" label="주최 기관" error={errors.organizer}>
            <input id="organizer" type="text" value={values.organizer} aria-invalid={invalid("organizer")} onChange={(e) => set("organizer", e.target.value)} />
          </Field>
          <Field id="participatedOn" label="참가일" error={errors.participatedOn}>
            <input id="participatedOn" type="date" value={values.participatedOn} aria-invalid={invalid("participatedOn")} onChange={(e) => set("participatedOn", e.target.value)} />
          </Field>
          <Field id="award" label="수상" help="예: 대상, 우수상" error={errors.award}>
            <input id="award" type="text" value={values.award} aria-invalid={invalid("award")} onChange={(e) => set("award", e.target.value)} />
          </Field>
          <Field id="periodStart" label="작업 시작일" error={errors.periodStart}>
            <input id="periodStart" type="date" value={values.periodStart} aria-invalid={invalid("periodStart")} onChange={(e) => set("periodStart", e.target.value)} />
          </Field>
          <Field id="periodEnd" label="작업 종료일" error={errors.periodEnd}>
            <input id="periodEnd" type="date" value={values.periodEnd} aria-invalid={invalid("periodEnd")} onChange={(e) => set("periodEnd", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h2>팀과 역할</h2>
        <Field id="teamType" label="팀/개인" error={errors.teamSize}>
          <div className="choice-row" id="teamType">
            {([["", "선택 안 함"], ["solo", "개인"], ["team", "팀"]] as const).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="teamType" value={value} checked={values.teamType === value} onChange={() => set("teamType", value)} />
                {label}
              </label>
            ))}
            {values.teamType === "team" && (
              <label>
                인원
                <input type="number" min={2} max={999} style={{ width: 90 }} value={values.teamSize} aria-label="팀 인원" aria-invalid={invalid("teamSize")} onChange={(e) => set("teamSize", e.target.value)} />
                명
              </label>
            )}
          </div>
        </Field>
        <Field id="role" label="내 역할" error={errors.role}>
          <input id="role" type="text" value={values.role} aria-invalid={invalid("role")} onChange={(e) => set("role", e.target.value)} />
        </Field>
        <Field id="devMethod" label="개발 방식" help="직접 코딩은 코드를 직접 짠 작품, AI 협업은 AI와 함께 구현한 작품이에요.">
          <div className="choice-row" id="devMethod">
            {([["", "선택 안 함"], ["hand", DEV_METHOD_LABELS.hand], ["ai", DEV_METHOD_LABELS.ai]] as const).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="devMethod" value={value} checked={values.devMethod === value} onChange={() => set("devMethod", value)} />
                {label}
              </label>
            ))}
          </div>
        </Field>
      </section>

      <section className="form-section">
        <h2>기술과 링크</h2>
        <Field id="techs" label="사용 기술" help="예: React, Figma" error={errors.techs}>
          <TagInput id="techs" values={values.techs} onChange={(v) => set("techs", v)} suggestions={suggestions.techs} placeholder="기술 입력" invalid={Boolean(errors.techs)} />
        </Field>
        <Field id="links" label="링크" help="GitHub, 데모, 영상(유튜브는 상세 페이지에서 바로 재생돼요)">
          <LinkRowsInput<WorkLink>
            id="links"
            rows={values.links}
            onChange={(rows) => set("links", rows)}
            makeEmpty={() => ({ kind: "github", label: "", url: "" })}
            withKind
            errors={errors}
            max={LINKS_MAX}
          />
        </Field>
      </section>

      {mode === "edit" && (
        <section className="form-section">
          <h2>작품 주소</h2>
          <Field id="slug" label="주소" help="바꾸면 예전 링크로는 이 작품이 열리지 않아요." error={errors.slug}>
            <input id="slug" type="text" value={values.slug} aria-invalid={invalid("slug")} onChange={(e) => set("slug", e.target.value)} />
          </Field>
        </section>
      )}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "저장하는 중…" : "저장"}
        </button>
        <a className="btn" href="/admin">
          목록으로
        </a>
        {dirty && <span className="admin-muted">저장하지 않은 변경이 있어요.</span>}
      </div>
    </form>
  );
}
