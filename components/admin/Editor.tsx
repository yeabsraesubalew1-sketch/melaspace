"use client";

import { useEffect, useRef } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import { createEditorTools } from "./editor-tools";
import type { ResourceItem } from "@/types/api";
import ResourceMentionHoverCard from "@/components/resources/ResourceMentionHoverCard";

interface EditorProps {
  initialData?: OutputData;
  onChange: (data: OutputData) => void;
  isAdmin?: boolean;
  onResourceMentioned?: (resource: ResourceItem) => void;
}

export default function Editor({
  initialData,
  onChange,
  isAdmin = false,
  onResourceMentioned,
}: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const initialDataRef = useRef(initialData);
  const onResourceMentionedRef = useRef(onResourceMentioned);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onResourceMentionedRef.current = onResourceMentioned;
  }, [onResourceMentioned]);

  useEffect(() => {
    let isMounted = true;
    let instance: EditorJS | null = null;

    if (!holderRef.current) return;
    if (editorRef.current) return;

    const init = async () => {
      const { default: EditorJS } = await import("@editorjs/editorjs");
      const tools = await createEditorTools({
        isAdmin,
        onResourceMentioned: (res) => {
          onResourceMentionedRef.current?.(res);
        },
      });

      if (!isMounted || !holderRef.current) return;

      const editor = new EditorJS({
        holder: holderRef.current,
        tools: tools as Record<string, object>,
        data: initialDataRef.current,
        autofocus: false,
        async onChange(api) {
          const data = await api.saver.save();
          onChangeRef.current(data);
        },
      });

      instance = editor;
      editorRef.current = editor;

      await editor.isReady;
      if (!isMounted) {
        if (typeof editor.destroy === "function") {
          editor.destroy();
        }
        return;
      }

      try {
        if (holderRef.current && isMounted) {
          const editorWithConfig = editor as unknown as {
            configuration?: { holder?: HTMLElement | string; readOnly?: boolean };
          };
          if (!editorWithConfig.configuration) {
            editorWithConfig.configuration = {
              holder: holderRef.current,
              readOnly: false,
            };
          }
          const { default: DragDrop } = await import("editorjs-drag-drop");
          new DragDrop(editor);
        }
      } catch (dragDropErr) {
        console.warn("DragDrop initialization bypassed:", dragDropErr);
      }
    };

    init();

    // Intercept clicks on resource mentions while editing so the admin doesn't navigate away
    const holder = holderRef.current;
    const handleHolderClick = (e: MouseEvent) => {
      const mention = (e.target as HTMLElement).closest(".resource-mention");
      if (mention) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    holder?.addEventListener("click", handleHolderClick, true);

    return () => {
      holder?.removeEventListener("click", handleHolderClick, true);
      isMounted = false;

      const editor = editorRef.current ?? instance;

      if (editor && typeof editor.destroy === "function") {
        editor.destroy();
      }

      editorRef.current = null;
      instance = null;
    };
  }, [isAdmin]);

  return (
    <div className="editor-wrapper rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
      <div ref={holderRef} />
      <ResourceMentionHoverCard />
    </div>
  );
}