import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import "@/models/Category";
import type { ApiResponse } from "@/types/api";
import type { EditorContent } from "@/types/editor";

interface Params {
  slug: string;
}

interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface PublicBlogFull {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categories: PopulatedCategory[];
  content: EditorContent;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PopulatedCategoryDoc {
  _id: { toString(): string };
  name: string;
  slug: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    const blog = await Blog.findOne({
      slug,
      status: "published",
    })
      .populate("categories", "_id name slug")
      .lean();

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Blog not found",
        },
        { status: 404 }
      );
    }

    const response: PublicBlogFull = {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      categories: ((blog.categories ?? []) as unknown as PopulatedCategoryDoc[]).map((category) => ({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      })),
      content: blog.content,
      publishedAt: blog.publishedAt?.toISOString(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<PublicBlogFull>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/blogs/[slug] error", error);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
