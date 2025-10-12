import Section from "../../layout/Section";

export default function CTABand() {
  return (
    <Section>
      <div className="container-app">
        <div className="rounded-2xl overflow-hidden bg-brand-navy text-white p-8 md:p-10 relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue to-brand-lightblue" />
          <h3 className="text-2xl font-semibold italic">Need help today?</h3>
          <p className="mt-2 text-white/80">
            Book a technician — we’ll get you back on track quickly.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="/contact" className="rounded-md bg-white text-brand-navy px-4 py-2 font-semibold hover:bg-slate-100">
              Contact Us
            </a>
            <a href="/location" className="rounded-md border border-white px-4 py-2 font-semibold hover:bg-white/10">
              Service Areas
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
