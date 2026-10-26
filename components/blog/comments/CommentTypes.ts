export interface CommentAuthor {
  id?: string;
  name: string;
  avatar?: string;
  role?: string;
  isMelaTeam?: boolean;
  isBlogAuthor?: boolean;
}

export interface CommentItemData {
  id: string;
  blogId: string;
  author: CommentAuthor;
  content: string;
  parentId: string | null;
  replyTo?: {
    userId?: string;
    name?: string;
  } | null;
  likesCount: number;
  replyCount: number;
  hasLiked: boolean;
  canDelete: boolean;
  canPin: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string | Date;
}

export interface CommentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
