// blockRenderer.tsx

import React from "react";

type Block = {
  type: "paragraph" | "h1" | "h2" | "image" | "list" | "blockquote";
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
            // Auto-generate ID for Table of Contents
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
          // Add image and table cases here safely
          default:
            return null;
        }
      })}
    </div>
  );
}
