import { Link } from "react-router-dom";

export default function BlogSidebar({ categories, activeCategory, onSelectCategory }) {
  return (
    <aside className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="font-semibold text-brand-navy">Categories</div>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <button
              onClick={() => onSelectCategory("")}
              className={`hover:underline ${!activeCategory ? "font-semibold text-brand-blue" : ""}`}
            >
              All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <button
                onClick={() => onSelectCategory(c)}
                className={`hover:underline ${activeCategory === c ? "font-semibold text-brand-blue" : ""}`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="font-semibold text-brand-navy">Get updates</div>
        <p className="mt-1 text-sm text-slate-600">
          Join our monthly tips email—no spam, just useful how-tos.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); alert("Demo only — connect to backend later."); }}
          className="mt-3 flex gap-2"
        >
          <input
            type="email"
            placeholder="you@example.com"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lightblue/60"
          />
          <button className="rounded-md bg-brand-blue text-white px-3 text-sm hover:bg-brand-navy">
            Subscribe
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">Unsubscribe anytime.</p>
      </section>
    </aside>
  );
}
