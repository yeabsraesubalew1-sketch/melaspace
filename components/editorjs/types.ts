// components/editorjs/types.ts

export type BlockType =
  | "paragraph"
  | "header"
  | "list"
  | "quote"
  | "embed"
  | "delimiter"
  | "image"
  | "file"
  | "attaches";

/* -------------------------------- */
/* Paragraph */
/* -------------------------------- */

export interface ParagraphBlock {
  type: "paragraph";
  data: {
    text: string;
  };
}

/* -------------------------------- */
/* Header */
/* -------------------------------- */

export interface HeaderBlock {
  type: "header";
  data: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

/* -------------------------------- */
/* List */
/* -------------------------------- */

export interface ListItem {
  content: string;
  meta?: {
    checked?: boolean;
  };
  items?: ListItem[];
}

export interface ListBlock {
  type: "list";
  data: {
    style: "ordered" | "unordered" | "checklist";
    meta?: {
      counterType?: "numeric" | "lower-roman" | "upper-roman" | "lower-alpha" | "upper-alpha";
    };
    items: ListItem[];
  };
}

/* -------------------------------- */
/* Quote */
/* -------------------------------- */

export interface QuoteBlock {
  type: "quote";
  data: {
    text: string;
    caption?: string;
    alignment?: "left" | "center";
  };
}

/* -------------------------------- */
/* Embed */
/* -------------------------------- */

export interface EmbedBlock {
  type: "embed";
  data: {
    service?: string;
    source?: string;
    embed?: string;
    width?: number;
    height?: number;
    caption?: string;
  };

  tunes?: {
    embedSize?: {
      width?: number;
      height?: number;
    };
  };
}

/* -------------------------------- */
/* Divider */
/* -------------------------------- */

export interface DividerBlock {
  type: "delimiter";
  data: Record<string, never>;
}

/* -------------------------------- */
/* Image */
/* -------------------------------- */

export interface ImageBlock {
  type: "image";
  data: {
    id?: number;
    fileVaultId?: number;
    url: string;
    caption?: string;
    width?: number;
    alignment?: "left" | "center" | "right";
    withBorder?: boolean;
    stretched?: boolean;
    withBackground?: boolean;
    original_name?: string;
    size_bytes?: number;
  };
}

/* -------------------------------- */
/* File / Attachment */
/* -------------------------------- */

export interface FileBlock {
  type: "file" | "attaches";
  data: {
    id?: number;
    fileVaultId?: number;
    url?: string;
    downloadUrl?: string;
    original_name?: string;
    title?: string;
    mime_type?: string;
    size_bytes?: number;
    extension?: string;
    isPrivate?: boolean;
  };
}

/* -------------------------------- */
/* Union */
/* -------------------------------- */

export type RenderableBlock =
  | ParagraphBlock
  | HeaderBlock
  | ListBlock
  | QuoteBlock
  | EmbedBlock
  | DividerBlock
  | ImageBlock
  | FileBlock;