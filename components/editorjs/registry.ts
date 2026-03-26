import HeaderBlock from "./blocks/HeaderBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import ListBlock from "./blocks/ListBlock";
import QuoteBlock from "./blocks/QuoteBlock";
import EmbedBlock from "./blocks/EmbedBlock";
import DividerBlock from "./blocks/DividerBlock";

export const blockRegistry = {
  header: HeaderBlock,
  paragraph: ParagraphBlock,
  list: ListBlock,
  quote: QuoteBlock,
  embed: EmbedBlock,
  delimiter: DividerBlock,
} as const;