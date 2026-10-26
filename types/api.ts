import type { EditorContent } from "./editor";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface BlogCategoryPreview {
  _id: string;
  name: string;
  slug: string;
}

export interface BlogAuthorPreview {
  id?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  joinedAt?: string;
  isMelaTeam?: boolean;
}

export interface FeaturedImage {
  url: string;
  alt?: string;
  caption?: string;
  fileVaultId?: number;
  storageKey?: string;
}

/**
 * Lightweight blog shape for lists, search, previews.
 */
export interface BlogPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categories: BlogCategoryPreview[];
  publishedAt?: string;
  status?: "draft" | "published";
  isPinned?: boolean;
  views?: number;
  commentsCount?: number;
  author?: BlogAuthorPreview;
  authorId?: string;
  authorName?: string;
  isAnonymous?: boolean;
  isBookmarked?: boolean;
  featuredImage?: FeaturedImage;
  linkedResourceIds?: string[];
}

/**
 * Full blog payload for single post pages.
 */
export interface BlogFull extends BlogPreview {
  content: EditorContent;
  aiSummary?: EditorContent;
  linkedResources?: ResourceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceFileItem {
  label: string;
  fileVaultId: number;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
}

export interface ResourceCoverImageItem {
  url: string;
  alt?: string;
  fileVaultId?: number;
}

export interface ResourceItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  category: string;
  tags: string[];
  coverImage?: ResourceCoverImageItem;
  files: ResourceFileItem[];
  downloadCount: number;
  status: "draft" | "published" | "trashed";
  authorId?: string;
  authorName?: string;
  linkedBlogIds?: string[];
  linkedBlogs?: Array<{ id: string; title: string; slug: string; excerpt?: string }>;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

