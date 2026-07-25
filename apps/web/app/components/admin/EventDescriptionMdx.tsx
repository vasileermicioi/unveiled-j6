"use client";

/**
 * MDXEditor load surface — imported only from EventDescriptionEditor via dynamic import
 * so `@mdxeditor/editor` never loads on the public SSR Markdown path.
 *
 * Form-control exception (with EventImageUpload / EventGeoPicker): visual Markdown authoring;
 * submit still uses the native `description` field synced by the parent.
 * Product design-system.md exception note deferred to event-markdown-03.
 */
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

type EventDescriptionMdxProps = {
  markdown: string;
  onChange: (markdown: string) => void;
  contentEditableClassName?: string;
  className?: string;
};

const plugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  markdownShortcutPlugin(),
  toolbarPlugin({
    toolbarContents: () => (
      <>
        <UndoRedo />
        <Separator />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
        <Separator />
        <ListsToggle />
        <CreateLink />
      </>
    ),
  }),
];

export function EventDescriptionMdx({
  markdown,
  onChange,
  contentEditableClassName,
  className,
}: EventDescriptionMdxProps) {
  return (
    <MDXEditor
      className={className}
      contentEditableClassName={contentEditableClassName}
      markdown={markdown}
      onChange={(value) => {
        onChange(value);
      }}
      plugins={plugins}
    />
  );
}
