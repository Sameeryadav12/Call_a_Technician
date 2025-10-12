import Section from "../components/layout/Section";
import BlogHero from "../components/sections/Blog/BlogHero";
import BlogGrid from "../components/sections/Blog/BlogGrid";
import BlogSidebar from "../components/sections/Blog/BlogSidebar";
import { POSTS, CATEGORIES } from "../data/blog";

export default function Blog() {
  // If later you want category from query param, wire it here.
  const activeCategory = "";
  const posts = activeCategory ? POSTS.filter(p => p.category === activeCategory) : POSTS;

  return (
    <div className="text-slate-800">
      <BlogHero />

      <Section>
        <div className="container-app grid lg:grid-cols-[1fr_320px] gap-8">
          <BlogGrid posts={posts} />
          <BlogSidebar
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              // For now just alert; later you can update state/URL
              alert(`Demo only — filter to "${cat}" (we can wire this to state or URL param).`);
            }}
          />
        </div>
      </Section>

      {/* CTA band */}
      <Section>
        <div className="rounded-2xl overflow-hidden">
          <div className="bg-brand-navy text-white p-8 md:p-10 relative rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue to-brand-lightblue" />
            <h3 className="text-2xl font-semibold italic">
              Need help today? Book a technician in minutes.
            </h3>
            <p className="mt-2 text-white/80">
              On-site support across Adelaide and nearby suburbs.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="/contact" className="rounded-md bg-white text-brand-navy px-4 py-2 font-semibold hover:bg-slate-100">
                Contact Us
              </a>
              <a href="/services" className="rounded-md border border-white px-4 py-2 font-semibold hover:bg-white/10">
                View Services
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
