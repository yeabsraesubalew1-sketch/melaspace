import type { DividerBlock as DividerBlockType } from "../types";

interface Props {
  block: DividerBlockType;
}

export default function DividerBlock({}: Props) {
  return (
    <hr className="my-12 border-t opacity-30" />
  );
}