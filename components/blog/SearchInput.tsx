"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
  basePath?: string;
  placeholder?: string;
}

export default function SearchInput({
  basePath = "/blogs",
  placeholder = "Search articles...",
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [value, setValue] = useState(params.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newParams = new URLSearchParams(params.toString());

    if (value) {
      newParams.set("q", value);
    } else {
      newParams.delete("q");
    }

    newParams.delete("page");

    router.push(`${basePath}?${newParams.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      />
    </form>
  );
}