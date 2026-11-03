import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "../../lib/format";
import { groupAttachments } from "../../lib/files/group";
import { usageLabel } from "../../lib/files/rules";
import type { FileKind, FileView } from "../../lib/files/types";
import { UploadError, filesFromDrop, folderOf, uploadFile } from "./upload";

interface Props {
  mode: "work" | "avatar";
  workId: string | null;
  initialFiles: FileView[];
  usedBytes: number;
}

interface Job {
  key: number;
  file: File;
  kind: FileKind;
  relativePath: string;
  status: "waiting" | "uploading" | "error";
  progress: number;
  error: string | null;
}

const MAX_PARALLEL = 3;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export default function FileManager({ mode, workId, initialFiles, usedBytes }: Props) {
  const [files, setFiles] = useState<FileView[]>(initialFiles);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [used, setUsed] = useState(usedBytes);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const running = useRef(new Set<number>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const nextKey = useRef(1);

  const update = (key: number, patch: Partial<Job>) =>
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...patch } : job)));

  const enqueue = (kind: FileKind, items: { file: File; relativePath: string }[]) => {
    if (items.length === 0) return;
    setNotice(null);
    setJobs((current) => [
      ...current,
      ...items.map((item) => ({ key: nextKey.current++, ...item, kind, status: "waiting" as const, progress: 0, error: null })),
    ]);
  };

  async function run(job: Job) {
    update(job.key, { status: "uploading", progress: 0, error: null });
    try {
      const view = await uploadFile({ file: job.file, kind: job.kind, relativePath: job.relativePath, workId }, (progress) =>
        update(job.key, { progress }),
      );
      const single = job.kind === "cover" || job.kind === "avatar";
      const replaced = single ? filesRef.current.filter((file) => file.kind === job.kind) : [];
      setUsed((value) => value + view.sizeBytes - replaced.reduce((sum, file) => sum + file.sizeBytes, 0));
      setFiles((current) => [...current.filter((file) => !(single && file.kind === job.kind)), view]);
      setJobs((current) => current.filter((item) => item.key !== job.key));
    } catch (error) {
      update(job.key, { status: "error", error: error instanceof UploadError ? error.message : "올리지 못했어요. 다시 시도해 주세요." });
    } finally {
      running.current.delete(job.key);
    }
  }

  useEffect(() => {
    const active = jobs.filter((job) => job.status === "uploading").length;
    const ready = jobs.filter((job) => job.status === "waiting" && !running.current.has(job.key)).slice(0, Math.max(0, MAX_PARALLEL - active));
    for (const job of ready) {
      running.current.add(job.key);
      void run(job);
    }
  }, [jobs]);

  const pick = (kind: FileKind, withFolders = false) => (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    enqueue(kind, picked.map((file) => ({ file, relativePath: withFolders ? folderOf(file) : "" })));
    event.target.value = "";
  };

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    enqueue("attachment", await filesFromDrop(event.dataTransfer.items));
  }

  async function remove(file: FileView) {
    if (!window.confirm(`'${file.name}'을(를) 지울까요? 되돌릴 수 없어요.`)) return;
    const response = await fetch(`/api/admin/files/${file.id}/delete`, { method: "POST", credentials: "same-origin" }).catch(() => null);
    if (!response?.ok) {
      setNotice("지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setUsed((value) => Math.max(0, value - file.sizeBytes));
  }

  async function move(file: FileView, direction: "up" | "down") {
    const gallery = files.filter((item) => item.kind === "gallery");
    const index = gallery.findIndex((item) => item.id === file.id);
    const other = gallery[direction === "up" ? index - 1 : index + 1];
    if (!other) return;
    const response = await fetch(`/api/admin/files/${file.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
      credentials: "same-origin",
    }).catch(() => null);
    if (!response?.ok) {
      setNotice("순서를 바꾸지 못했어요.");
      return;
    }
    setFiles((current) => current.map((item) => (item.id === file.id ? other : item.id === other.id ? file : item)));
  }

  const cover = files.find((file) => file.kind === (mode === "avatar" ? "avatar" : "cover")) ?? null;
  const gallery = files.filter((file) => file.kind === "gallery");
  const attachments = files.filter((file) => file.kind === "attachment");
  const singleKind: FileKind = mode === "avatar" ? "avatar" : "cover";

  return (
    <section className="form-section file-manager" aria-label="파일">
      <div className="file-head">
        <h2>{mode === "avatar" ? "프로필 사진" : "파일"}</h2>
        <p className="admin-muted" data-usage>
          저장 공간 {usageLabel(used)}
        </p>
      </div>
      {notice && (
        <p className="alert alert-error" role="alert">
          {notice}
        </p>
      )}

      <div className="file-block">
        {mode === "work" && <h3>대표 이미지</h3>}
        <div className="single-image">
          {cover ? <img src={cover.thumbUrl ?? cover.url} alt="" /> : <span className="single-empty">아직 없어요</span>}
          <div className="file-actions">
            <label className="btn btn-small">
              {cover ? "바꾸기" : "이미지 고르기"}
              <input id={`${singleKind}-input`} type="file" accept={IMAGE_ACCEPT} hidden onChange={pick(singleKind)} />
            </label>
            {cover && (
              <button type="button" className="btn btn-small btn-danger" onClick={() => remove(cover)}>
                지우기
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === "work" && (
        <>
          <div className="file-block">
            <h3>스크린샷</h3>
            {gallery.length > 0 && (
              <ul className="file-grid">
                {gallery.map((file, index) => (
                  <li key={file.id}>
                    <img src={file.thumbUrl ?? file.url} alt={file.name} />
                    <div className="file-grid-actions">
                      <button type="button" aria-label="앞으로" disabled={index === 0} onClick={() => move(file, "up")}>
                        ←
                      </button>
                      <button type="button" aria-label="뒤로" disabled={index === gallery.length - 1} onClick={() => move(file, "down")}>
                        →
                      </button>
                      <button type="button" aria-label={`${file.name} 지우기`} onClick={() => remove(file)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <label className="btn btn-small">
              이미지 추가
              <input id="gallery-input" type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={pick("gallery")} />
            </label>
          </div>

          <div className="file-block">
            <h3>첨부 파일·폴더</h3>
            <div
              className={dragging ? "dropzone dragging" : "dropzone"}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <p>여기에 파일이나 폴더를 끌어다 놓으세요. 파일 하나에 1GB까지 올릴 수 있어요.</p>
              <div className="file-actions">
                <label className="btn btn-small">
                  파일 고르기
                  <input id="attachment-input" type="file" multiple hidden onChange={pick("attachment")} />
                </label>
                <label className="btn btn-small">
                  폴더 고르기
                  <input
                    id="folder-input"
                    type="file"
                    multiple
                    hidden
                    ref={(element) => {
                      element?.setAttribute("webkitdirectory", "");
                    }}
                    onChange={pick("attachment", true)}
                  />
                </label>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="attachment-groups">
                {groupAttachments(attachments).map((group) => (
                  <div key={group.folder}>
                    {group.folder && <p className="attachment-folder">{group.folder}</p>}
                    <ul className="attachment-list">
                      {group.files.map((file) => (
                        <li key={file.id}>
                          <a href={file.url}>{file.name}</a>
                          <span className="admin-muted">{formatBytes(file.sizeBytes)}</span>
                          <button type="button" className="btn btn-small btn-danger" onClick={() => remove(file)}>
                            지우기
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {jobs.length > 0 && (
        <ul className="upload-list" aria-live="polite">
          {jobs.map((job) => (
            <li key={job.key} className={job.status === "error" ? "upload-row upload-error" : "upload-row"}>
              <span className="upload-name">{job.relativePath ? `${job.relativePath}/${job.file.name}` : job.file.name}</span>
              {job.status === "error" ? (
                <>
                  <span className="field-error">{job.error}</span>
                  <button type="button" className="btn btn-small" onClick={() => update(job.key, { status: "waiting", error: null })}>
                    다시 시도
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setJobs((current) => current.filter((item) => item.key !== job.key))}>
                    빼기
                  </button>
                </>
              ) : (
                <progress max={1} value={job.status === "waiting" ? 0 : job.progress}>
                  {Math.round(job.progress * 100)}%
                </progress>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
