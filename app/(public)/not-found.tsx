import Link from "next/link";

export default function PublicNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-foreground/60">404</p>
      <h1 className="mt-3 text-3xl font-semibold">We could not find that page</h1>
      <p className="mt-3 text-foreground/70">
        Try returning to the homepage or browsing the latest blog posts.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/blogs" className="btn btn-secondary">
          Browse blogs
        </Link>
      </div>
    </main>
  );
}
