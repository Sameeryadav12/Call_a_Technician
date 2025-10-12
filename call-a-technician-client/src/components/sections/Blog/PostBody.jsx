export default function PostBody({ content = [] }) {
  return (
    <article className="prose prose-slate max-w-none">
      {content.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "p":
            return <p key={i}>{block.text}</p>;
          case "quote":
            return (
              <blockquote key={i}>
                {block.text}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i}>
                {block.items?.map((it, idx) => <li key={idx}>{it}</li>)}
              </ul>
            );
          case "img":
            return (
              <img
                key={i}
                src={block.src}
                alt={block.alt || ""}
                className="rounded-lg"
                loading="lazy"
              />
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
