import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import "@/models/Category";
import { Category } from "@/models/Category";
import type { ApiResponse } from "@/types/api";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// -----------------------------
// Rate limit (public reads)
// -----------------------------
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req / min / IP
});

interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface PublicBlogPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categories: PopulatedCategory[];
  publishedAt?: string;
}

interface PopulatedCategoryDoc {
  _id: { toString(): string };
  name: string;
  slug: string;
}

// -----------------------------
// GET /api/blogs (public)
// -----------------------------
export async function GET(req: Request) {
  try {
    // ---- rate limit ----
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "public";
    let isAllowed = true;

    try {
      const { success } = await ratelimit.limit(ip);
      isAllowed = success;
    } catch (rateLimitError) {
      console.warn("Rate limit unavailable, skipping enforcement", rateLimitError);
    }

    if (!isAllowed) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Too many requests" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(
      Number(searchParams.get("limit")) || 20,
      50
    );

    const search = searchParams.get("q")?.trim();

    await connectDB();

    const filter: Record<string, unknown> = {
      status: "published",
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const category = searchParams.get("category");

if (category) {
  const cat = await Category.findOne({ slug: category }).select("_id");

  if (cat) {
    filter.categories = cat._id;
  }
}

const total = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug excerpt categories publishedAt")
      .populate("categories", "_id name slug")
      .lean();

    const data: PublicBlogPreview[] = blogs.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      categories: ((b.categories ?? []) as unknown as PopulatedCategoryDoc[]).map((category) => ({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      })),
      publishedAt: b.publishedAt?.toISOString(),
    }));

    return NextResponse.json<ApiResponse<PublicBlogPreview[]>>({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
});
  } catch (err) {
    console.error("PUBLIC BLOG GET ERROR", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
