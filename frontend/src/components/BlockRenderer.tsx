// BlockRenderer.tsx
import DOMPurify from "isomorphic-dompurify";

// ─── Types ───────────────────────────────────────────────────────────────────

type ParagraphData  = { text: string };
type HeadingData    = { text: string; level?: number };
type BlockquoteData = { text: string };
type ListData       = { style: "ordered" | "unordered"; items: string[] };
type ImageData      = { file?: { url: string }; caption?: string };
type TableData      = { content: string[][]; withHeadings?: boolean };

type Block =
  | { type: "paragraph";   data: ParagraphData }
  | { type: "h1" | "h2";  data: HeadingData }
  | { type: "blockquote";  data: BlockquoteData }
  | { type: "list";        data: ListData }
  | { type: "image";       data: ImageData }
  | { type: "table";       data: TableData };

// ─── Allowed inline HTML (from EditorJS inline tools) ────────────────────────

const INLINE_TAGS  = ["b", "i", "em", "strong", "a", "mark", "code", "s", "u"];
const INLINE_ATTRS = ["href", "target", "rel"];

function sanitizeInline(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS:  INLINE_TAGS,
    ALLOWED_ATTR:  INLINE_ATTRS,
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InlineHtml({ html, tag: Tag = "p", ...props }: {
  html: string;
  tag?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}) {
  return (
    <Tag
      dangerouslySetInnerHTML={{ __html: sanitizeInline(html) }}
      {...props}
    />
  );
}

// ─── Main Renderer ───────────────────────────────────────────────────────────

export default function BlockRenderer({ content }: { content: Block[] }) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="prose dark:prose-invert max-w-none">
      {content.map((block, index) => {
        const key = index;

        switch (block.type) {

          case "h1":
            return <InlineHtml key={key} tag="h1" html={block.data.text} />;

          case "h2": {
            const id = block.data.text.toLowerCase().replace(/\s+/g, "-");
            return <InlineHtml key={key} tag="h2" id={id} html={block.data.text} />;
          }

          case "paragraph":
            return <InlineHtml key={key} tag="p" html={block.data.text} />;

          case "blockquote":
            return <InlineHtml key={key} tag="blockquote" html={block.data.text} />;

          case "list": {
            const items = block.data.items;
            const Tag = block.data.style === "ordered" ? "ol" : "ul";
            return (
              <Tag key={key}>
                {items.map((item, i) => (
                  <InlineHtml key={i} tag="li" html={item} />
                ))}
              </Tag>
            );
          }

          case "image": {
            const { file, caption } = block.data;
            if (!file?.url) return null;
            return (
              <figure key={key} className="my-8">
                <img
                  src={file.url}
                  alt={caption || "Blog image"}
                  className="rounded-xl w-full h-auto object-cover"
                />
                {caption && (
                  <figcaption className="text-center text-sm text-gray-500 mt-2">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "table": {
            const { content: rows, withHeadings } = block.data;
            return (
              <div
                key={key}
                className="overflow-x-auto my-8 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  {withHeadings && rows[0] && (
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {rows[0].map((cell, ci) => (
                          <th
                            key={ci}
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {(withHeadings ? rows.slice(1) : rows).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}