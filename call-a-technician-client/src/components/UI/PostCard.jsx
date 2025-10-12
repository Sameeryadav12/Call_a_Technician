import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <article className="group rounded-xl border bg-white overflow-hidden hover:shadow-lg transition">
      <Link to={`/blog/${post.id}`} className="block">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="h-44 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-44 w-full bg-slate-100" />
        )}
      </Link>

      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-brand-blue">{post.category}</div>
        <h3 className="mt-1 font-semibold text-brand-navy leading-snug line-clamp-2">
          <Link to={`/blog/${post.id}`}>{post.title}</Link>
        </h3>
        <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div>By {post.author} • {post.readMins} min read</div>
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
        </div>
      </div>
    </article>
  );
}
