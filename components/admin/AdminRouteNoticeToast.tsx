"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

interface Props {
  reason?: string;
}

export default function AdminRouteNoticeToast({ reason }: Props) {
  useEffect(() => {
    if (reason === "invalid-id") {
      toast.error("Invalid blog id. Starting a new draft instead.", {
        id: "admin-invalid-blog-id",
      });
    }
  }, [reason]);

  return null;
}
