import React from "react";

type Block = {
  type:
    | "paragraph"
    | "h1"
    | "h2"
    | "image"
    | "list"
    | "blockquote"
    | "table";
  data: any;
};

export default function BlockRenderer({ content }: { content: Block[] }) {
  if (!content || !Array.isArray(content)) return null;

  return (
    <div className="prose dark:prose-invert max-w-none">
      {content.map((block, index) => {
        switch (block.type) {
          case "h1":
            return <h1 key={index}>{block.data.text}</h1>;

          case "h2":
            const id = block.data.text.toLowerCase().replace(/\s+/g, "-");
            return (
              <h2 key={index} id={id}>
                {block.data.text}
              </h2>
            );

          case "paragraph":
            return <p key={index}>{block.data.text}</p>;

          case "blockquote":
            return <blockquote key={index}>{block.data.text}</blockquote>;

          case "list":
            return block.data.style === "ordered" ? (
              <ol key={index}>
                {block.data.items.map((li: string, i: number) => (
                  <li key={i}>{li}</li>
                ))}
              </ol>
            ) : (
              <ul key={index}>
                {block.data.items.map((li: string, i: number) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            );

          // ✅ IMAGE
          case "image":
            return (
              <figure key={index} className="my-8">
                <img
                  src={block.data.file?.url}
                  alt={block.data.caption || "Blog Image"}
                  className="rounded-xl w-full h-auto object-cover"
                />
                {block.data.caption && (
                  <figcaption className="text-center text-sm text-gray-500 mt-2">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );

          // ✅ TABLE
          case "table":
            return (
              <div
                key={index}
                className="overflow-x-auto my-8 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {block.data.content.map(
                      (row: string[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {block.data.withHeadings && rowIndex === 0 ? (
                                <strong>{cell}</strong>
                              ) : (
                                cell
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}