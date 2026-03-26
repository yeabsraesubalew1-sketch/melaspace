"use client";

import { useEffect, useRef } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import { createEditorTools } from "./editor-tools";

interface EditorProps {
  initialData?: OutputData;
  onChange: (data: OutputData) => void;
}

export default function Editor({ initialData, onChange }: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);


  useEffect(() => {
    let isMounted = true;
    let instance: EditorJS | null = null;

    if (!holderRef.current) return;
    if (editorRef.current) return;

    const init = async () => {
      const { default: EditorJS } = await import("@editorjs/editorjs");
      const tools = await createEditorTools();

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

      const { default: DragDrop } = await import("editorjs-drag-drop");
      new DragDrop(editor);
    };

    init();

    return () => {
      isMounted = false;

      const editor = editorRef.current ?? instance;

      if (editor && typeof editor.destroy === "function") {
        editor.destroy();
      }

      editorRef.current = null;
      instance = null;
    };
  }, []);


  return (
    <div className="editor-wrapper rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
      <div ref={holderRef} />
    </div>
  );
}