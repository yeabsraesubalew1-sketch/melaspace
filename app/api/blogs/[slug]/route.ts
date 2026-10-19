import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import "@/models/Category";
import "@/models/User";
import Bookmark from "@/models/Bookmark";
import type { ApiResponse, BlogFull } from "@/types/api";

interface Params {
  slug: string;
}

interface PopulatedCategoryDoc {
  _id: { toString(): string };
  name: string;
  slug: string;
}

interface PopulatedAuthorDoc {
  _id: { toString(): string };
  name: string;
  avatar?: string;
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
      .populate("author", "_id name avatar role")
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

    // Check if user has bookmarked this blog
    let isBookmarked = false;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const found = await Bookmark.exists({
          userId: session.user.id,
          blogId: blog._id,
        });
        isBookmarked = Boolean(found);
      }
    } catch {
      // Ignore session errors for public reading
    }

    const populatedAuthor = blog.author as unknown as (PopulatedAuthorDoc & { role?: string }) | null;
    const isAnonymous = Boolean(blog.isAnonymous);
    const isTeamAuthor = populatedAuthor && ["root_admin", "super_admin", "manager"].includes(populatedAuthor.role || "");
    const authorName = isAnonymous
      ? (blog.authorName === "Anonymous" || !isTeamAuthor ? "Anonymous" : "Mela Team")
      : (blog.authorName || populatedAuthor?.name || "Mela Team");

    const response: BlogFull = {
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
      isPinned: Boolean(blog.isPinned),
      views: blog.views ?? 0,
      authorName,
      author: isAnonymous || !populatedAuthor
        ? {
            name: authorName,
          }
        : {
            id: populatedAuthor._id.toString(),
            name: populatedAuthor.name,
            avatar: populatedAuthor.avatar,
          },
      isAnonymous,
      isBookmarked,
    };

    return NextResponse.json<ApiResponse<BlogFull>>({
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
