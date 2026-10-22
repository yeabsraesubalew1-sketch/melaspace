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
  name: string;
  avatar?: string;
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
  author?: BlogAuthorPreview;
  authorId?: string;
  authorName?: string;
  isAnonymous?: boolean;
  isBookmarked?: boolean;
  featuredImage?: FeaturedImage;
}

/**
 * Full blog payload for single post pages.
 */
export interface BlogFull extends BlogPreview {
  content: EditorContent;
  createdAt: string;
  updatedAt: string;
}
