import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-foreground/60">404</p>
      <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-foreground/70">
        The page you requested does not exist or may have been moved.
      </p>
      <div className="mt-8">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    </main>
  );
}
