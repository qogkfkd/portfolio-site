import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  id: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
}

const LINK_PATTERN = /^(https?:\/\/|mailto:)/i;

function promptLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("링크 주소를 입력하세요. 비우면 링크를 지워요.", previous ?? "https://");
  if (input === null) return;
  const url = input.trim();
  const chain = editor.chain().focus().extendMarkRange("link");
  if (url === "" || url === "https://") {
    chain.unsetLink().run();
  } else if (!LINK_PATTERN.test(url)) {
    window.alert("주소는 http://, https:// 또는 mailto:로 시작해야 해요.");
  } else {
    chain.setLink({ href: url }).run();
  }
}

export default function RichTextEditor({ id, value, onChange, invalid = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto"] },
      }),
    ],
    content: value,
    editorProps: { attributes: { id, class: "editor-content", "aria-label": "작품 설명" } },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? "" : current.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            strike: current.isActive("strike"),
            bulletList: current.isActive("bulletList"),
            orderedList: current.isActive("orderedList"),
            blockquote: current.isActive("blockquote"),
            codeBlock: current.isActive("codeBlock"),
            link: current.isActive("link"),
          }
        : null,
  });

  if (!editor || !active) return null;

  const buttons: { label: string; pressed?: boolean; run: () => void }[] = [
    { label: "소제목", pressed: active.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "작은 제목", pressed: active.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "굵게", pressed: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "기울임", pressed: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "밑줄", pressed: active.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "취소선", pressed: active.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: "목록", pressed: active.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "번호 목록", pressed: active.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "인용", pressed: active.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "코드", pressed: active.codeBlock, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "구분선", run: () => editor.chain().focus().setHorizontalRule().run() },
    { label: "링크", pressed: active.link, run: () => promptLink(editor) },
  ];

  return (
    <div className="editor" aria-invalid={invalid || undefined}>
      <div className="editor-toolbar" role="toolbar" aria-label="서식">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            aria-pressed={button.pressed === undefined ? undefined : button.pressed}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.run}
          >
            {button.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
