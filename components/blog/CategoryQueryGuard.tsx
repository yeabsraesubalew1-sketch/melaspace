"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

interface Props {
  validCategorySlugs: string[];
  basePath?: string;
}

export default function CategoryQueryGuard({
  validCategorySlugs,
  basePath = "/blogs",
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const hasHandledInvalidCategory = useRef(false);

  useEffect(() => {
    const category = params.get("category");

    if (!category) {
      hasHandledInvalidCategory.current = false;
      return;
    }

    const exists = validCategorySlugs.includes(category);

    if (exists) {
      hasHandledInvalidCategory.current = false;
      return;
    }

    if (hasHandledInvalidCategory.current) {
      return;
    }

    hasHandledInvalidCategory.current = true;

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("category");
    nextParams.delete("page");

    const nextQuery = nextParams.toString();

    toast.error("Category not found. Showing all blogs.");
    router.replace(nextQuery ? `${basePath}?${nextQuery}` : basePath);
  }, [basePath, params, router, validCategorySlugs]);

  return null;
}