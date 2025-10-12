import PostCard from "../../UI/PostCard";

export default function RelatedPosts({ allPosts = [], currentId, category }) {
  const related = allPosts
    .filter(p => p.id !== currentId && p.category === category)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold text-brand-navy">Related posts</h3>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map(p => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}
