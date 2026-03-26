import type { ListBlock as ListBlockType, ListItem } from "../types";

interface Props {
  block: ListBlockType;
}

function getOrderedType(counterType?: string) {
  switch (counterType) {
    case "lower-roman":
      return "lower-roman";
    case "upper-roman":
      return "upper-roman";
    case "lower-alpha":
      return "lower-alpha";
    case "upper-alpha":
      return "upper-alpha";
    default:
      return "numeric";
  }
}

function formatOrderedSegment(index: number, counterType: string) {
  const value = index + 1;

  switch (counterType) {
    case "lower-roman":
      return new Intl.NumberFormat("en", { numberingSystem: "latn" }) && toRoman(value).toLowerCase();
    case "upper-roman":
      return toRoman(value);
    case "lower-alpha":
      return toAlpha(value).toLowerCase();
    case "upper-alpha":
      return toAlpha(value);
    default:
      return String(value);
  }
}

function toRoman(value: number) {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = value;
  let result = "";

  for (const [numericValue, numeral] of numerals) {
    while (remaining >= numericValue) {
      result += numeral;
      remaining -= numericValue;
    }
  }

  return result;
}

function toAlpha(value: number) {
  let remaining = value;
  let result = "";

  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(65 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }

  return result;
}

function renderItems(
  items: ListItem[],
  style: ListBlockType["data"]["style"],
  counterType: string,
  path: number[] = []
) {
  return items.map((item, index) => {
    const hasChildren = Array.isArray(item.items) && item.items.length > 0;
    const currentPath = [...path, index];

    if (style === "checklist") {
      return (
        <li key={currentPath.join("-")} className="flex gap-2 items-start">
          <span
            aria-hidden="true"
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-admin-check-border ${
              item.meta?.checked ? "bg-admin-check-fill" : "bg-background"
            }`}
          >
            {item.meta?.checked && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-foreground"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>

          <div>
            <span
              dangerouslySetInnerHTML={{ __html: item.content }}
            />

            {hasChildren && (
              <ul className="pl-6 mt-2 space-y-2">
                {renderItems(item.items ?? [], style, counterType, currentPath)}
              </ul>
            )}
          </div>
        </li>
      );
    }

    const marker =
      style === "ordered"
        ? `${currentPath.map((segment) => formatOrderedSegment(segment, counterType)).join(".")}.`
        : "•";

    return (
      <li key={currentPath.join("-")} className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
        <span className="min-w-8 pt-0.5 text-sm font-medium text-neutral-500">
          {marker}
        </span>

        <div>
          <span
            dangerouslySetInnerHTML={{ __html: item.content }}
          />

          {hasChildren && (
            <ul className="mt-2 space-y-2 pl-2">
              {renderItems(item.items ?? [], style, counterType, currentPath)}
            </ul>
          )}
        </div>
      </li>
    );
  });
}

export default function ListBlock({ block }: Props) {
  const { style, items, meta } = block.data;
  const counterType = getOrderedType(meta?.counterType);

  if (style === "checklist") {
    return (
      <ul className="pl-0 space-y-2 my-6">
        {renderItems(items, style, counterType)}
      </ul>
    );
  }

  return (
    <ul className="pl-0 space-y-2 my-6">
      {renderItems(items, style, counterType)}
    </ul>
  );
}