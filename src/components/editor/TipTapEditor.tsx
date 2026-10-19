"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import {
  Bold,
  Italic,
  List,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Quote,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const emptySubscribe = () => () => {};

export function TipTapEditor({
  content = "",
  onChange,
  placeholder = "Type '/' for commands or describe the issue...",
  editable = true,
  className,
}: TipTapEditorProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[140px] w-full text-sm text-[#111827] outline-none focus:outline-none p-3",
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Keep editor content in sync when controlled content updates externally
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!isMounted || !editor) {
    return (
      <div
        className={cn(
          "min-h-[140px] w-full rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 text-sm text-[#9ca3af]",
          className
        )}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[#e5e7eb] bg-white transition-all focus-within:border-[#3e63dd] shadow-xs",
        className
      )}
    >
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[#e5e7eb] bg-[#f8f9fa] px-2 py-1.5 text-[#6b7280]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("bold") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("italic") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <div className="h-3.5 w-px bg-[#e5e7eb] mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("heading", { level: 1 }) && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("heading", { level: 2 }) && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <div className="h-3.5 w-px bg-[#e5e7eb] mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("bulletList") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("taskList") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Task list"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("codeBlock") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Code block"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors",
              editor.isActive("blockquote") && "bg-white text-[#3e63dd] shadow-xs border border-[#e5e7eb]"
            )}
            title="Quote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="rounded p-1 hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors"
            title="Insert table"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
