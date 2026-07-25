"use client";

/**
 * Allowed non-native form exception (alongside EventImageUpload / EventGeoPicker):
 * MDXEditor for Markdown authoring. Persistence stays SSR form POST via native
 * `name="description"` textarea sync. See design-system.md § Form controls.
 */
import { Surface } from "@heroui/react";
import { type ComponentType, useEffect, useId, useRef, useState } from "react";

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
  const [MdxEditor, setMdxEditor] = useState<ComponentType<EventDescriptionMdxProps> | null>(null);
  /** MDXEditor reads `markdown` only on mount — capture seed when the editor first loads. */
  const editorSeedRef = useRef<string | null>(null);

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

  if (MdxEditor && editorSeedRef.current === null) {
    editorSeedRef.current = markdown;
  }

  return (
    <Surface className="admin-event-description-editor flex flex-col gap-2" variant="transparent">
      {MdxEditor && editorSeedRef.current !== null ? (
        <MdxEditor
          className="admin-event-description-editor__mdx"
          contentEditableClassName="admin-event-description-editor__content"
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
        required={required}
        rows={MdxEditor ? 2 : 8}
        value={markdown}
      />
    </Surface>
  );
}
