"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error?.toLowerCase() === "accessdenied") {
  toast.error("Access denied. Admins only.");
}

  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your admin Google account.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="
            mt-6 w-full rounded-md
            bg-primary px-4 py-2
            text-sm font-medium text-primary-foreground
            hover:opacity-90
            hover:cursor-pointer
            transition
          "
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
