/**
 * Allowed non-native form exception (alongside EventImageUpload / EventGeoPicker):
 * MDXEditor for Markdown authoring. Persistence stays SSR form POST via native
 * `name="description"` textarea sync. See design-system.md § Form controls.
 */
import { Surface } from "@heroui/react";
import { type ComponentType, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import {
  draftFieldValue,
  FORM_DRAFT_APPLIED_EVENT,
  FORM_DRAFT_FLUSH_EVENT,
  type FormDraftAppliedDetail,
  type FormDraftFlushDetail,
} from "../../lib/form-draft";

export type EventDescriptionEditorProps = {
  initialMarkdown?: string;
  name?: string;
  required?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

type EventDescriptionMdxProps = {
  markdown: string;
  onChange: (markdown: string) => void;
  contentEditableClassName?: string;
  className?: string;
};

export function EventDescriptionEditor({
  initialMarkdown = "",
  name = "description",
  required = true,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: EventDescriptionEditorProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [MdxEditor, setMdxEditor] = useState<ComponentType<EventDescriptionMdxProps> | null>(null);
  /** MDXEditor reads `markdown` only on mount — capture seed when the editor first loads. */
  const editorSeedRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markdownRef = useRef(markdown);
  markdownRef.current = markdown;

  useEffect(() => {
    let cancelled = false;
    void import("./EventDescriptionMdx").then((mod) => {
      if (!cancelled) {
        setMdxEditor(() => mod.EventDescriptionMdx);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    function formForEditor(): HTMLFormElement | null {
      const textarea = textareaRef.current;
      if (!textarea) {
        return null;
      }
      return textarea.form ?? textarea.closest("form");
    }

    function onFlush(event: Event) {
      const detail = (event as CustomEvent<FormDraftFlushDetail>).detail;
      const form = formForEditor();
      if (!detail?.form || form !== detail.form || !textareaRef.current) {
        return;
      }
      textareaRef.current.value = markdownRef.current;
    }

    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      const form = formForEditor();
      if (!detail?.form || form !== detail.form) {
        return;
      }
      const next = draftFieldValue(detail.fields, name);
      if (next === undefined) {
        return;
      }
      setMarkdown(next);
      editorSeedRef.current = null;
      setEditorEpoch((current) => current + 1);
    }

    document.addEventListener(FORM_DRAFT_FLUSH_EVENT, onFlush);
    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_FLUSH_EVENT, onFlush);
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, [name]);

  if (MdxEditor && editorSeedRef.current === null) {
    editorSeedRef.current = markdown;
  }

  return (
    <Surface className="admin-event-description-editor flex flex-col gap-2" variant="transparent">
      {MdxEditor && editorSeedRef.current !== null ? (
        <MdxEditor
          className="admin-event-description-editor__mdx"
          contentEditableClassName="admin-event-description-editor__content"
          key={editorEpoch}
          markdown={editorSeedRef.current}
          onChange={setMarkdown}
        />
      ) : null}
      <textarea
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        className={
          MdxEditor
            ? "admin-event-description-editor__sync"
            : "admin-event-description-editor__fallback"
        }
        id={fieldId}
        name={name}
        onChange={(event) => {
          setMarkdown(event.target.value);
        }}
        ref={textareaRef}
        required={required}
        rows={MdxEditor ? 2 : 8}
        value={markdown}
      />
    </Surface>
  );
}
