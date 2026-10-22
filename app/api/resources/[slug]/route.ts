import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Blog } from "@/models/Blog";
import { Types } from "mongoose";
import type { ResourceItem } from "@/types/api";

const ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

interface Params {
  slug: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Resource identifier is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: new Types.ObjectId(slug) }] } : { slug };

    const resource = await Resource.findOne(query).lean();

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check status permissions
    if (resource.status !== "published") {
      const session = await getServerSession(authOptions);
      const userRole = session?.user?.role;
      const isAdmin = Boolean(userRole && ADMIN_ROLES.includes(userRole));

      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Resource is not published" },
          { status: 404 }
        );
      }
    }

    // Fetch linked blogs that reference this resource
    const linkedBlogDocs = await Blog.find({
      $or: [
        { _id: { $in: resource.linkedBlogIds || [] } },
        { linkedResourceIds: resource._id },
      ],
      status: "published",
    })
      .select("title slug excerpt featuredImage publishedAt")
      .lean();

    const linkedBlogs = linkedBlogDocs.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      featuredImage: b.featuredImage,
      publishedAt: b.publishedAt?.toISOString(),
    }));

    const data: ResourceItem = {
      id: resource._id.toString(),
      title: resource.title,
      slug: resource.slug,
      excerpt: resource.excerpt,
      description: resource.description,
      category: resource.category,
      tags: resource.tags || [],
      coverImage: resource.coverImage,
      files: resource.files || [],
      downloadCount: resource.downloadCount || 0,
      status: resource.status,
      authorName: resource.authorName || "Mela Team",
      linkedBlogIds: resource.linkedBlogIds?.map((id) => id.toString()) || [],
      linkedBlogs,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/resources/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resource details" },
      { status: 500 }
    );
  }
}
