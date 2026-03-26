import Link from "next/link";
import BlogEditor from "@/components/admin/blog-editor";
import AdminRouteNoticeToast from "@/components/admin/AdminRouteNoticeToast";

export default async function NewBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const reasonParam = Array.isArray(resolvedSearchParams.reason)
    ? resolvedSearchParams.reason[0]
    : resolvedSearchParams.reason;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <AdminRouteNoticeToast reason={reasonParam} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Link href="/admin/blogs" className="underline underline-offset-4">
            Blogs
          </Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-semibold">New Blog</h1>
        <p className="text-sm text-foreground/60">
          Draft and publish your next article.
        </p>
      </div>

      <BlogEditor mode="create" />
    </div>
  );
}