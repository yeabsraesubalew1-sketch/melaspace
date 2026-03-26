// app/admin/test-editor/page.tsx

"use client";

import { useState } from "react";
import Editor from "@/components/admin/Editor";
import type { OutputData } from "@editorjs/editorjs";
import InquiryForm from "@/components/forms/InquiryForm";
import WaitlistForm from "@/components/forms/WaitlistForm";

export default function TestEditorPage() {
  const [data, setData] = useState<OutputData | undefined>();

  return (
    <div className="p-8">
      <Editor
        initialData={data}
        onChange={(val) => setData(val)}
      />
      <InquiryForm />
      <WaitlistForm />
    </div>
  );
}