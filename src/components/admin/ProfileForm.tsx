import { useState } from "react";
import type { ProfileLink } from "../../lib/types";
import { charCount } from "../../lib/validate/common";
import { PROFILE_LINKS_MAX, validateProfileInput, type ProfileInput } from "../../lib/validate/profile";
import { failureMessage, sendJson } from "./api";
import { withoutError } from "./errors";
import Field from "./Field";
import LinkRowsInput from "./LinkRowsInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

interface Props {
  initial: ProfileInput;
}

type Notice = { kind: "success" | "error"; text: string } | null;

export default function ProfileForm({ initial }: Props) {
  const [values, setValues] = useState<ProfileInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedWarning(dirty);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => withoutError(current, key));
  };

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const check = validateProfileInput(values);
    if (!check.ok) {
      setErrors(check.errors);
      setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const result = await sendJson("PUT", "/api/admin/profile", values);
    setSaving(false);
    if (result.ok) {
      setErrors({});
      setDirty(false);
      setNotice({ kind: "success", text: "저장했어요." });
    } else if (result.status === 400 && result.data?.errors) {
      setErrors(result.data.errors);
      setNotice({ kind: "error", text: "입력 내용을 확인해 주세요." });
    } else {
      setNotice({ kind: "error", text: failureMessage(result) });
    }
  }

  const invalid = (key: string) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={submit} noValidate>
      {notice && (
        <p className={`alert ${notice.kind === "success" ? "alert-success" : "alert-error"}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      )}
      <section className="form-section">
        <h2>홈 첫 화면에 보이는 정보</h2>
        <Field id="name" label="이름" required error={errors.name}>
          <input id="name" type="text" value={values.name} aria-invalid={invalid("name")} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field id="headline" label="한 줄 소개" help="예: 만들고 기록하는 개발자" error={errors.headline}>
          <input id="headline" type="text" value={values.headline} aria-invalid={invalid("headline")} onChange={(e) => set("headline", e.target.value)} />
        </Field>
        <Field id="bio" label="자기소개" help={`${charCount(values.bio)}/1000자 · 줄바꿈이 그대로 보여요.`} error={errors.bio}>
          <textarea id="bio" rows={5} value={values.bio} aria-invalid={invalid("bio")} onChange={(e) => set("bio", e.target.value)} />
        </Field>
      </section>
      <section className="form-section">
        <h2>연락처</h2>
        <div className="form-grid">
          <Field id="email" label="이메일" error={errors.email}>
            <input id="email" type="email" value={values.email} aria-invalid={invalid("email")} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field id="githubUrl" label="GitHub 주소" error={errors.githubUrl}>
            <input id="githubUrl" type="url" placeholder="https://github.com/" value={values.githubUrl} aria-invalid={invalid("githubUrl")} onChange={(e) => set("githubUrl", e.target.value)} />
          </Field>
        </div>
        <Field id="links" label="기타 링크" help="블로그, 링크드인 등">
          <LinkRowsInput<ProfileLink>
            id="links"
            rows={values.links}
            onChange={(rows) => set("links", rows)}
            makeEmpty={() => ({ label: "", url: "" })}
            withKind={false}
            errors={errors}
            max={PROFILE_LINKS_MAX}
          />
        </Field>
      </section>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "저장하는 중…" : "저장"}
        </button>
        {dirty && <span className="admin-muted">저장하지 않은 변경이 있어요.</span>}
      </div>
    </form>
  );
}
