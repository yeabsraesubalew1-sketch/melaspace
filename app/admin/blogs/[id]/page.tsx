import Link from "next/link";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import BlogEditor from "@/components/admin/blog-editor";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    redirect("/admin/blogs/new?reason=invalid-id");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Link href="/admin/blogs" className="underline underline-offset-4">
            Blogs
          </Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-semibold">Edit Blog</h1>
        <p className="text-sm text-foreground/60">
          Update your draft or published article.
        </p>
      </div>

      <BlogEditor mode="edit" blogId={id} />

    </div>
  );
}