import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background/85 p-8 text-center shadow-sm">
      <p className="text-sm uppercase tracking-wide text-foreground/60">Admin 404</p>
      <h1 className="mt-3 text-3xl font-semibold">Admin page not found</h1>
      <p className="mt-3 text-foreground/70">
        That admin route does not exist.
      </p>
      <div className="mt-8">
        <Link href="/admin" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
