import Section from "../../layout/Section";

export default function ProcessStrip() {
  const steps = [
    { n: "1", t: "Get in touch", d: "Tell us your issue and preferred time." },
    { n: "2", t: "We come to you", d: "Home or office — most problems fixed on the spot." },
    { n: "3", t: "No Fix, No Fee", d: "Clear pricing and friendly wrap-up." },
  ];
  return (
    <Section muted>
      <div className="container-app">
        <h2 className="text-center text-2xl font-semibold text-brand-navy">How it works</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue text-white font-semibold">{s.n}</div>
              <div className="mt-3 font-semibold text-brand-navy">{s.t}</div>
              <p className="text-sm text-slate-600 mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
