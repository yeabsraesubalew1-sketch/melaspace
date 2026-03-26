/**
 * Represents a single Editor.js block.
 * `data` is intentionally loose because different tools
 * (paragraph, image, list, etc.) have different shapes.
 */
export interface EditorBlock {
  id?: string;
  type: string;
  data: unknown;
}

/**
 * Root Editor.js document format.
 * This is what gets stored in MongoDB.
 */
export interface EditorContent {
  time: number;
  blocks: EditorBlock[];
  version: string;
}
