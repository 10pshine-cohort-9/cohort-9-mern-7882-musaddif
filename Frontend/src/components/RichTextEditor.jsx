import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  [{ color: [] }, { background: [] }],
  ["link", "clean"],
];

function RichTextEditor({ value = "", onChange, placeholder = "Write your note here..." }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) return;

    const quill = new Quill(container, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        clipboard: {
          matchVisual: false,
        },
      },
      placeholder,
    });

    quillRef.current = quill;

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      if (onChangeRef.current) {
        onChangeRef.current(html === "<p><br></p>" ? "" : html);
      }
    });

    // Set the initial content (if any) once the editor is ready.
    if (initialValueRef.current) {
      quill.clipboard.dangerouslyPasteHTML(initialValueRef.current);
    }

    return () => {
      quillRef.current = null;
      const toolbar = container.previousElementSibling;
      if (toolbar && toolbar.classList.contains("ql-toolbar")) {
        toolbar.remove();
      }
      container.classList.remove("ql-container");
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external changes (e.g. when editing a note with a loaded value).
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML;
    if (value !== current) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value || "");
      if (selection && quill.hasFocus()) {
        quill.setSelection(selection, "silent");
      }
    }
  }, [value]);

  return (
    <div className="rich-text-editor">
      <div
        ref={containerRef}
        data-testid="rich-text-editor"
        aria-label="Rich text editor"
      />
    </div>
  );
}

export default RichTextEditor;