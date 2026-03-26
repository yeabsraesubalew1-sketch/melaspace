// components/editorjs/types.ts

export type BlockType =
  | "paragraph"
  | "header"
  | "list"
  | "quote"
  | "embed"
  | "delimiter";

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
/* Union */
/* -------------------------------- */

export type RenderableBlock =
  | ParagraphBlock
  | HeaderBlock
  | ListBlock
  | QuoteBlock
  | EmbedBlock
  | DividerBlock;